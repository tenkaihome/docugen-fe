import { useState, useCallback, useEffect } from 'react';
import { EnterpriseTemplate, ProcessState, ExcelSection, ExcelItem } from '@/common/types';
import { apiClient } from '@/api/apiClient';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';

export const useDocxGenerator = (sections: ExcelSection[], selectedSections: string[]) => {
  const [templates, setTemplates] = useState<EnterpriseTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  
  const [processState, setProcessState] = useState<ProcessState>('IDLE');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [productNameMappings, setProductNameMappings] = useState<{ [prefix: string]: string }>({});

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
        return (
          normalizedCompanyName.includes(normalizedTemplateName) || 
          normalizedTemplateName.includes(normalizedCompanyName)
        );
      });

      if (matched) return matched;
    }

    // 3. Fallback matching by companyId if any exists in templates
    const matchedById = templates.find((t) => t.id === section.companyId);
    if (matchedById) return matchedById;

    return null;
  }, [selectedTemplateId, templates]);

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
  const generateSectionDocument = useCallback(async (section: ExcelSection, customItems?: ExcelItem[]) => {
    const template = getTemplateForSection(section);
    if (!template) {
      alert(`Lỗi: Không tìm thấy mẫu Word cho công ty: ${section.companyName}`);
      return;
    }

    try {
      const itemsToUse = customItems || section.items;
      const docName = `BaoCao_${section.companyId}_So_${section.so_de_nghi.replace(/[\/\\:]/g, '_')}.docx`;
      const blob = await apiClient.generateDocumentOnServer(
        template.id, 
        itemsToUse, 
        section.id, 
        section,
        undefined,
        productNameMappings
      );
      saveAs(blob, docName);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.message || err.message;
      alert(`Lỗi tạo báo cáo Section:\n${errMsg}`);
    }
  }, [getTemplateForSection, productNameMappings]);

  /**
   * Compiles active items, groups them by company, and generates separate ZIP files for each company.
   */
  const generateAllAsZips = useCallback(async (filterItemKeys?: string[]) => {
    const activeSections = sections.filter(
      (s) => selectedSections.includes(s.id) && getTemplateForSection(s) !== null
    );
    if (activeSections.length === 0) {
      alert('Lỗi: Chưa chọn Section nào hợp lệ hoặc không có biểu mẫu khớp với các công ty được chọn.');
      return;
    }

    setIsProcessing(true);
    setProcessState('GENERATING');

    try {
      // Group sections by companyId to create separate zip files
      const groupedSections: { [companyId: string]: ExcelSection[] } = {};
      for (const section of activeSections) {
        if (!groupedSections[section.companyId]) {
          groupedSections[section.companyId] = [];
        }
        groupedSections[section.companyId].push(section);
      }

      const companyIds = Object.keys(groupedSections);

      for (const companyId of companyIds) {
        const companySecs = groupedSections[companyId];
        const representativeSec = companySecs[0];
        
        // Find matched template
        const template = getTemplateForSection(representativeSec);
        if (!template) {
          console.warn(`Không tìm thấy mẫu phù hợp cho công ty: ${representativeSec.companyName}`);
          continue;
        }

        const companyZip = new PizZip();
        let companyFileCount = 0;
        let lastFileBlob: Blob | null = null;
        let lastDocName = '';

        for (const section of companySecs) {
          const itemsToUse = filterItemKeys
            ? section.items.filter(item => filterItemKeys.includes(`${section.id}-stt-${item.stt}-idx-${item.index}`))
            : section.items;

          if (itemsToUse.length === 0) continue;

          const docName = `BaoCao_${section.companyId}_So_${section.so_de_nghi.replace(/[\/\\:]/g, '_')}.docx`;

          const fileBlob = await apiClient.generateDocumentOnServer(
            template.id, 
            itemsToUse, 
            section.id, 
            section,
            undefined,
            productNameMappings
          );

          const arrayBuffer = await fileBlob.arrayBuffer();
          companyZip.file(docName, arrayBuffer);
          companyFileCount++;
          lastFileBlob = fileBlob;
          lastDocName = docName;
        }

        if (companyFileCount === 1 && companyIds.length === 1 && lastFileBlob) {
          saveAs(lastFileBlob, lastDocName);
        } else if (companyFileCount > 0) {
          const zipContent = companyZip.generate({
            type: 'blob',
            mimeType: 'application/zip',
          });

          const safeCompanyName = normalizeString(representativeSec.companyName).toUpperCase();
          const zipName = `DocuGen_${safeCompanyName}_Export_${new Date().toISOString().slice(0, 10)}.zip`;
          saveAs(zipContent, zipName);
        }

        await new Promise((r) => setTimeout(r, 200)); // Sleep between downloads to avoid browser block
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
  }, [sections, selectedSections, getTemplateForSection, productNameMappings]);

  return {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    processState,
    setProcessState,
    isProcessing,
    generateSingleRow,
    generateSectionDocument,
    generateAllDocuments: generateAllAsZips,
    getTemplateForSection,
    uploadCustomTemplate,
    removeCustomTemplate,
    productNameMappings,
    setProductNameMappings,
  };
};
