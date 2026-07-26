import { useState, useCallback } from 'react';
import { ExcelSection } from '@/common/types';
import { parseExcelFile } from '@/common/excelHelper';

export const useExcelParser = () => {
  const [file, setFile] = useState<File | null>(null);
  const [sections, setSections] = useState<ExcelSection[]>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setIsParsing(true);
    setError(null);
    setFile(uploadedFile);
    
    try {
      const parsedSections = await parseExcelFile(uploadedFile);
      setSections(parsedSections);
      
      // Auto-select only the first parsed section by default to avoid checking all tabs
      if (parsedSections.length > 0) {
        setSelectedSections([parsedSections[0].id]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Không thể phân tích tệp Excel.');
      setSections([]);
      setSelectedSections([]);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const toggleSection = useCallback((sectionId: string) => {
    setSelectedSections((prev) => {
      if (prev.includes(sectionId)) {
        return prev.filter((id) => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  }, []);

  const selectAllSections = useCallback(() => {
    setSelectedSections(sections.map(s => s.id));
  }, [sections]);

  const deselectAllSections = useCallback(() => {
    setSelectedSections([]);
  }, []);

  const clearParser = useCallback(() => {
    setFile(null);
    setSections([]);
    setSelectedSections([]);
    setError(null);
  }, []);

  return {
    file,
    sections,
    selectedSections,
    isParsing,
    error,
    handleFileUpload,
    toggleSection,
    selectAllSections,
    deselectAllSections,
    clearParser,
  };
};
