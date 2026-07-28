import { useState, useCallback, useEffect } from 'react';
import { EnterpriseTemplate, ProcessState, ExcelSection, ExcelItem } from '@/common/types';
import { apiClient } from '@/api/apiClient';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';

export interface ExportGroup {
  id: string;
  name: string;
  templateId: string;
  itemKeys: string[];
}

export const useDocxGenerator = (sections: ExcelSection[], selectedSections: string[]) => {
  const [templates, setTemplates] = useState<EnterpriseTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [templateOverrides, setTemplateOverrides] = useState<{ [itemKey: string]: string }>({});
  const [exportGroups, setExportGroups] = useState<Record<string, ExportGroup[]>>({});
  
  const [processState, setProcessState] = useState<ProcessState>('IDLE');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [productNameMappings, setProductNameMappings] = useState<{ [prefix: string]: string }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('docugen_product_name_mappings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved product name mappings', e);
        }
      }
    }
    return {};
  });

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem('docugen_product_name_mappings', JSON.stringify(productNameMappings));
  }, [productNameMappings]);

  // Load active templates
  const loadTemplates = useCallback(async () => {
    try {
      const data = await apiClient.getEnterpriseTemplates();
      const filtered = data.filter((t) => t.id !== 'phu-minh' && t.id !== 'xuan-loc-tho');
      setTemplates(filtered);
    } catch (err) {
      console.error('Failed to load templates', err);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Upload template to Firebase
  const uploadCustomTemplate = useCallback(async (file: File) => {
    setIsProcessing(true);
    try {
      await apiClient.uploadCustomTemplate(file);
      await loadTemplates();
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi tải lên mẫu Word lên Firebase:\n${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [loadTemplates]);

  // Delete template from Firebase
  const removeCustomTemplate = useCallback(async (templateId: string) => {
    setIsProcessing(true);
    try {
      await apiClient.deleteTemplate(templateId);
      await loadTemplates();
      if (selectedTemplateId === templateId) {
        setSelectedTemplateId('custom');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi xóa mẫu Word khỏi Firebase:\n${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedTemplateId, loadTemplates]);

  // Helper to normalize Vietnamese strings for fuzzy template matching
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]/g, '');
  };

  /**
   * Matches a parsed section to a template from Firebase
   */
  const getTemplateForSection = useCallback((section: ExcelSection): EnterpriseTemplate | null => {
    // 1. If a specific template is selected in the dropdown
    if (selectedTemplateId && selectedTemplateId !== 'custom') {
      const selectedTpl = templates.find((t) => t.id === selectedTemplateId);
      if (selectedTpl) return selectedTpl;
    }

    // 2. If auto-matching mode is selected (selectedTemplateId === 'custom')
    if (selectedTemplateId === 'custom') {
      if (templates.length === 0) {
        return null;
      }

      const normalizedCompanyName = normalizeString(section.companyName);

      // Look for fuzzy name match in loaded database templates
      const matched = templates.find((t) => {
        const normalizedTemplateName = normalizeString(t.name);
        if (
          normalizedCompanyName.includes(normalizedTemplateName) || 
          normalizedTemplateName.includes(normalizedCompanyName)
        ) {
          return true;
        }

        // Fallback: Split template name by words and check if any contiguous block of >= 2 words matches the company name
        const templateWords = t.name.toLowerCase().split(/[\s_-]+/);
        for (let i = 0; i < templateWords.length; i++) {
          for (let j = i + 2; j <= templateWords.length; j++) {
            const subName = templateWords.slice(i, j).join('');
            const normalizedSub = normalizeString(subName);
            if (normalizedSub.length >= 5 && normalizedCompanyName.includes(normalizedSub)) {
              return true;
            }
          }
        }
        return false;
      });

      if (matched) return matched;
    }

    // 3. Fallback matching by companyId if any exists in templates
    const matchedById = templates.find((t) => t.id === section.companyId);
    if (matchedById) return matchedById;

    return null;
  }, [selectedTemplateId, templates]);

  const getGroupsForCompany = useCallback((companyId: string, companyItems: any[], section: ExcelSection): ExportGroup[] => {
    const existing = exportGroups[companyId];
    const allItemKeys = companyItems.map(item => item.uniqueKey || `${section.id}-stt-${item.stt}-idx-${item.index}`);
    
    const defaultTemplate = getTemplateForSection(section);
    const defaultTemplateId = defaultTemplate?.id || 'custom';

    if (!existing || existing.length === 0) {
      return [
        {
          id: 'default',
          name: 'Nhóm 1',
          templateId: defaultTemplateId,
          itemKeys: allItemKeys,
        }
      ];
    }

    // Sync item keys
    const updated = existing.map(group => ({
      ...group,
      itemKeys: group.itemKeys.filter(k => allItemKeys.includes(k)),
    }));

    const assignedKeys = new Set(updated.flatMap(g => g.itemKeys));
    const unassignedKeys = allItemKeys.filter(k => !assignedKeys.has(k));

    if (unassignedKeys.length > 0) {
      if (updated[0]) {
        updated[0].itemKeys = [...updated[0].itemKeys, ...unassignedKeys];
      } else {
        updated.push({
          id: 'default',
          name: 'Nhóm 1',
          templateId: defaultTemplateId,
          itemKeys: unassignedKeys,
        });
      }
    }

    return updated;
  }, [exportGroups, getTemplateForSection]);

  const updateCompanyGroups = useCallback((companyId: string, groups: ExportGroup[]) => {
    setExportGroups(prev => ({
      ...prev,
      [companyId]: groups,
    }));
  }, []);

  const getTemplateForItem = useCallback((item: any, section: ExcelSection): EnterpriseTemplate | null => {
    if (!item) return null;
    const itemKey = item.uniqueKey || `${section.id}-stt-${item.stt}-idx-${item.index}`;
    const companyId = section.companyId;
    const groups = exportGroups[companyId];
    
    if (groups && groups.length > 0) {
      const groupContainingItem = groups.find(g => g.itemKeys.includes(itemKey));
      if (groupContainingItem) {
        const tplId = groupContainingItem.templateId;
        if (tplId && tplId !== 'custom') {
          const tpl = templates.find(t => t.id === tplId);
          if (tpl) return tpl;
        } else if (tplId === 'custom') {
          const autoTpl = getTemplateForSection(section);
          if (autoTpl) return autoTpl;
        }
      }
    }

    return getTemplateForSection(section);
  }, [exportGroups, templates, getTemplateForSection]);

  /**
   * Generates document for a single Excel row (creates a 1-page document with just that item).
   */
  const generateSingleRow = useCallback(async (
    rowData: ExcelItem,
    section: ExcelSection
  ) => {
    const template = getTemplateForSection(section);
    if (!template) {
      alert(`Lỗi: Không tìm thấy file mẫu Word cho công ty: ${section.companyName}`);
      return;
    }

    try {
      const docName = `Phieu_Rieng_${section.companyId}_STT_${rowData.stt}.docx`;
      const blob = await apiClient.generateDocumentOnServer(
        template.id, 
        [rowData], 
        section.id, 
        section,
        undefined,
        productNameMappings
      );
      saveAs(blob, docName);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message;
      alert(`Lỗi tạo phiếu sản phẩm:\n${errMsg}`);
    }
  }, [getTemplateForSection, productNameMappings]);

  /**
   * Generates a single combined Word document for a specific Section (containing all items as separate pages).
   */
  /**
   * Generates a single combined Word document for a specific Section (containing all items as separate pages).
   */
  const generateSectionDocument = useCallback(async (section: ExcelSection, customItems?: ExcelItem[]) => {
    try {
      const itemsToUse = customItems || section.items;
      if (itemsToUse.length === 0) return;

      const companyId = section.companyId;
      const groups = getGroupsForCompany(companyId, section.items, section);
      const tasks: { templateId: string; items: ExcelItem[]; section: ExcelSection }[] = [];

      for (const group of groups) {
        const itemsInGroup = itemsToUse.filter(item => {
          const itemKey = `${section.id}-stt-${item.stt}-idx-${item.index}`;
          return group.itemKeys.includes(itemKey);
        });

        if (itemsInGroup.length === 0) continue;

        let resolvedTemplateId = group.templateId;
        if (resolvedTemplateId === 'custom') {
          const autoTpl = getTemplateForSection(section);
          resolvedTemplateId = autoTpl?.id || '';
        }

        if (!resolvedTemplateId) {
          alert(`Không tìm thấy mẫu in phù hợp cho nhóm "${group.name}".`);
          return;
        }

        tasks.push({
          templateId: resolvedTemplateId,
          items: itemsInGroup,
          section: section
        });
      }

      if (tasks.length === 0) return;

      const mergedBlob = await apiClient.generateMultipleOnServer(tasks, productNameMappings);
      const docName = `BaoCao_${section.companyId}_So_${section.so_de_nghi.replace(/[\/\\:]/g, '_')}.docx`;
      saveAs(mergedBlob, docName);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message;
      alert(`Lỗi tạo báo cáo Section:\n${errMsg}`);
    }
  }, [getGroupsForCompany, getTemplateForSection, productNameMappings]);

  /**
   * Compiles active items, groups them by company, and generates separate ZIP files for each company.
   */
  const generateAllAsZips = useCallback(async (filterItemKeys?: string[]) => {
    const activeSections = sections.filter(
      (s) => selectedSections.includes(s.id)
    );
    if (activeSections.length === 0) {
      alert('Lỗi: Chưa chọn Section nào hợp lệ.');
      return;
    }

    setIsProcessing(true);
    setProcessState('GENERATING');

    try {
      // Group sections by companyId to create separate merged files
      const groupedSections: { [companyId: string]: ExcelSection[] } = {};
      for (const section of activeSections) {
        if (!groupedSections[section.companyId]) {
          groupedSections[section.companyId] = [];
        }
        groupedSections[section.companyId].push(section);
      }

      const companyIds = Object.keys(groupedSections);
      const outputZip = new PizZip();
      let generatedFileCount = 0;
      let lastFileBlob: Blob | null = null;
      let lastDocName = '';

      for (const companyId of companyIds) {
        const companySecs = groupedSections[companyId];
        const representativeSec = companySecs[0];

        const allCompanyItems: any[] = [];
        for (const sec of companySecs) {
          allCompanyItems.push(...sec.items.map(item => ({
            ...item,
            uniqueKey: `${sec.id}-stt-${item.stt}-idx-${item.index}`
          })));
        }

        const groups = getGroupsForCompany(companyId, allCompanyItems, representativeSec);
        const tasks: { templateId: string; items: ExcelItem[]; section: ExcelSection }[] = [];

        for (const section of companySecs) {
          const itemsToUse = filterItemKeys
            ? section.items.filter(item => 
                filterItemKeys.includes(`${section.id}-stt-${item.stt}-idx-${item.index}`)
              )
            : section.items;

          if (itemsToUse.length === 0) continue;

          for (const group of groups) {
            const itemsInGroup = itemsToUse.filter(item => {
              const itemKey = `${section.id}-stt-${item.stt}-idx-${item.index}`;
              return group.itemKeys.includes(itemKey);
            });

            if (itemsInGroup.length === 0) continue;

            let resolvedTemplateId = group.templateId;
            if (resolvedTemplateId === 'custom') {
              const autoTpl = getTemplateForSection(section);
              resolvedTemplateId = autoTpl?.id || '';
            }

            if (!resolvedTemplateId) {
              alert(`Không tìm thấy mẫu in phù hợp cho nhóm "${group.name}".`);
              setIsProcessing(false);
              setProcessState('ERROR');
              return;
            }

            tasks.push({
              templateId: resolvedTemplateId,
              items: itemsInGroup,
              section: section
            });
          }
        }

        if (tasks.length === 0) continue;

        // Generate the combined merged DOCX document on the server
        const mergedBlob = await apiClient.generateMultipleOnServer(tasks, productNameMappings);
        const safeCompanyName = normalizeString(representativeSec.companyName).toUpperCase();
        const docName = `DocuGen_${safeCompanyName}.docx`;

        outputZip.file(docName, await mergedBlob.arrayBuffer());
        generatedFileCount++;
        lastFileBlob = mergedBlob;
        lastDocName = docName;

        await new Promise((r) => setTimeout(r, 200)); // Sleep between requests
      }

      if (generatedFileCount === 1 && lastFileBlob) {
        saveAs(lastFileBlob, lastDocName);
      } else if (generatedFileCount > 0) {
        const zipContent = outputZip.generate({
          type: 'blob',
          mimeType: 'application/zip',
        });
        const zipName = `DocuGen_Export_${new Date().toISOString().slice(0, 10)}.zip`;
        saveAs(zipContent, zipName);
      }

      setProcessState('SUCCESS');
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message;
      alert(`Lỗi xuất file văn bản:\n${errMsg}`);
      setProcessState('ERROR');
    } finally {
      setIsProcessing(false);
    }
  }, [sections, selectedSections, getGroupsForCompany, getTemplateForSection, productNameMappings]);

  return {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    templateOverrides,
    setTemplateOverrides,
    exportGroups,
    setExportGroups,
    getGroupsForCompany,
    updateCompanyGroups,
    processState,
    setProcessState,
    isProcessing,
    generateSingleRow,
    generateSectionDocument,
    generateAllDocuments: generateAllAsZips,
    getTemplateForSection,
    getTemplateForItem,
    uploadCustomTemplate,
    removeCustomTemplate,
    productNameMappings,
    setProductNameMappings,
  };
};
