import axios from 'axios';
import { API_BASE_URL, ENTERPRISE_TEMPLATES } from '@/config';
import { EnterpriseTemplate } from '@/common/types';

// Create Axios Instance
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiClient = {
  /**
   * Fetches active Word templates from the back-end.
   * If the request fails, falls back to the locally configured enterprise templates.
   */
  getEnterpriseTemplates: async (): Promise<EnterpriseTemplate[]> => {
    try {
      const response = await client.get<EnterpriseTemplate[]>('/api/templates');
      return response.data;
    } catch (error) {
      console.warn('Backend templates API unavailable, falling back to static config.', error);
      // Fallback to static list configured locally
      return ENTERPRISE_TEMPLATES;
    }
  },

  /**
   * Triggers Word document generation on the back-end server.
   * Returns the generated file as a Blob.
   */
  generateDocumentOnServer: async (
    templateId: string,
    data: any[],
    sheetName: string,
    sectionDetails?: any,
    customFile?: File
  ): Promise<Blob> => {
    try {
      const formData = new FormData();
      formData.append('templateId', templateId);
      formData.append('data', JSON.stringify(data));
      formData.append('sheetName', sheetName);
      if (sectionDetails) {
        formData.append('section', JSON.stringify(sectionDetails));
      }
      if (customFile) {
        formData.append('template', customFile);
      }

      const response = await client.post(
        `/api/generate`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob', // Expect binary Word document back
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Server-side document generation failed:', error);
      let errorMsg = 'Server failed to process the template.';
      
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const parsed = JSON.parse(text);
          errorMsg = parsed.message || errorMsg;
        } catch (parseErr) {
          // If not parseable JSON, try to use raw text
          try {
            const rawText = await error.response.data.text();
            if (rawText && rawText.length < 200) {
              errorMsg = rawText;
            }
          } catch (e) {}
        }
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      throw new Error(errorMsg);
    }
  },

  /**
   * Optional: API endpoint to upload a custom word template file to the backend
   */
  uploadCustomTemplate: async (file: File): Promise<{ url: string; schema: string[] }> => {
    const formData = new FormData();
    formData.append('template', file);

    try {
      const response = await client.post<{ url: string; schema: string[] }>(
        '/api/templates/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Custom template upload failed:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to upload and analyze template on the server.'
      );
    }
  },

  deleteTemplate: async (id: string): Promise<void> => {
    try {
      await client.delete(`/api/templates/${id}`);
    } catch (error: any) {
      console.error('Failed to delete template:', error);
      throw new Error(
        error.response?.data?.message || 'Failed to delete template from server.'
      );
    }
  }
};
