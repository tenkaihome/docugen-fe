import { useState, useCallback, useEffect } from 'react';
import { EnterpriseTemplate, ProcessState, ExcelSection, ExcelItem } from '@/common/types';
import { apiClient } from '@/api/apiClient';
import { saveAs } from 'file-saver';
import PizZip from 'pizzip';

export const useDocxGenerator = (sections: ExcelSection[], selectedSections: string[]) => {
  const [templates, setTemplates] = useState<EnterpriseTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('custom');
  const [customTemplateFiles, setCustomTemplateFiles] = useState<File[]>([]);
  
  const [processState, setProcessState] = useState<ProcessState>('IDLE');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load active templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await apiClient.getEnterpriseTemplates();
        const filtered = data.filter((t) => t.id !== 'phu-minh' && t.id !== 'xuan-loc-tho');
        setTemplates(filtered);
        if (filtered.length > 0) {
          setSelectedTemplateId(filtered[0].id);
        } else {
          setSelectedTemplateId('custom');
        }
      } catch (err) {
        console.error('Failed to load templates', err);
        setSelectedTemplateId('custom');
      }
    };
    loadTemplates();
  }, []);

  // Helper to normalize Vietnamese strings for fuzzy template matching
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove Vietnamese accents
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]/g, '') // remove spaces & special characters
      .trim();
  };

  /**
   * Fuzzy matches section's companyName to one of the custom uploaded template files.
   */
  const getTemplateForSection = useCallback((section: ExcelSection): (EnterpriseTemplate & { customFile?: File }) | null => {
    if (selectedTemplateId === 'custom') {
      if (customTemplateFiles.length === 0) {
        return null;
      }

      const normalizedCompanyName = normalizeString(section.companyName);

      // Look for a fuzzy filename match
      const matchedFile = customTemplateFiles.find((file) => {
        const fileNameNoExt = file.name.replace(/\.docx$/i, '');
        const normalizedFileName = normalizeString(fileNameNoExt);
        return (
          normalizedCompanyName.includes(normalizedFileName) || 
          normalizedFileName.includes(normalizedCompanyName)
        );
      });

      if (!matchedFile) {
        return null; // Return null if no template matches
      }

      return {
        id: `custom-${matchedFile.name}`,
        name: `Custom: ${matchedFile.name}`,
        fileUrl: '',
        mappingSchema: [],
        customFile: matchedFile,
      };
    }

    // Default enterprise template matching
    const matched = templates.find((t) => t.id === section.companyId);
    if (matched) return matched;
    
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [selectedTemplateId, templates, customTemplateFiles]);

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
        template.customFile
      );
      saveAs(blob, docName);
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi tạo phiếu sản phẩm:\n${err.message}`);
    }
  }, [getTemplateForSection]);

  /**
   * Generates a single combined Word document for a specific Section (containing all items as separate pages).
   */
  const generateSectionDocument = useCallback(async (section: ExcelSection) => {
    const template = getTemplateForSection(section);
    if (!template) {
      alert(`Lỗi: Không tìm thấy mẫu Word cho công ty: ${section.companyName}`);
      return;
    }

    try {
      const docName = `BaoCao_${section.companyId}_So_${section.so_de_nghi.replace(/[\/\\:]/g, '_')}.docx`;
      const blob = await apiClient.generateDocumentOnServer(
        template.id, 
        section.items, 
        section.id, 
        section, 
        template.customFile
      );
      saveAs(blob, docName);
    } catch (err: any) {
      console.error(err);
      alert(`Lỗi tạo báo cáo Section:\n${err.message}`);
    }
  }, [getTemplateForSection]);

  /**
   * Compiles active items, groups them by company, and generates separate ZIP files for each company.
   */
  const generateAllAsZips = useCallback(async () => {
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

        for (const section of companySecs) {
          for (const item of section.items) {
            const cleanName = String(item.ten_hang).replace(/[\/\\:\*\?"<>\|]/g, '_').trim();
            const docName = `${cleanName}_STT_${item.stt}.docx`;

            const fileBlob = await apiClient.generateDocumentOnServer(
              template.id, 
              [item], 
              section.id, 
              section, 
              template.customFile
            );

            const arrayBuffer = await fileBlob.arrayBuffer();
            companyZip.file(docName, arrayBuffer);
            companyFileCount++;
          }
        }

        if (companyFileCount > 0) {
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
      alert(`Lỗi đóng gói tệp ZIP:\n${err.message}`);
      setProcessState('ERROR');
    } finally {
      setIsProcessing(false);
    }
  }, [sections, selectedSections, getTemplateForSection]);

  return {
    templates,
    selectedTemplateId,
    setSelectedTemplateId,
    customTemplateFiles,
    setCustomTemplateFiles,
    processState,
    setProcessState,
    isProcessing,
    generateSingleRow,
    generateSectionDocument,
    generateAllDocuments: generateAllAsZips,
    getTemplateForSection
  };
};
