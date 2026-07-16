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
      
      // Auto-select all parsed sections by default
      if (parsedSections.length > 0) {
        setSelectedSections(parsedSections.map(s => s.id));
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
        // Don't allow deselecting if it's the last selected section
        if (prev.length === 1) return prev;
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
    if (sections.length > 0) {
      // Keep at least the first section
      setSelectedSections([sections[0].id]);
    }
  }, [sections]);

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
