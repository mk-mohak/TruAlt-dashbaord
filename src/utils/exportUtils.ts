import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Papa from 'papaparse';
import { DataRow, ExportOptions } from '../types';

export class ExportUtils {
  static async exportToPDF(elementId: string, filename: string = 'dashboard-export.pdf', currency: string = 'INR') {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        height: element.scrollHeight,
        width: element.scrollWidth,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      
      const imgWidth = 297; // A4 landscape width
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Handle multi-page PDFs if content is too tall
      const pageHeight = 210; // A4 landscape height
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(filename);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      throw new Error('Failed to export PDF');
    }
  }

  static async exportToPNG(elementId: string, filename: string = 'dashboard-export.png', currency: string = 'INR') {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Element not found');
      }

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        height: element.scrollHeight,
        width: element.scrollWidth,
      });

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Export to PNG failed:', error);
      throw new Error('Failed to export PNG');
    }
  }

  static exportToCSV(data: DataRow[], filename: string = 'dashboard-data.csv') {
    try {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export to CSV failed:', error);
      throw new Error('Failed to export CSV');
    }
  }

  static exportToJSON(data: DataRow[], filename: string = 'dashboard-data.json') {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Export to JSON failed:', error);
      throw new Error('Failed to export JSON');
    }
  }

  static async exportDashboard(options: ExportOptions, data: DataRow[], currency: string = 'INR') {
    const timestamp = new Date().toISOString().split('T')[0];
    const quality = options.quality || 'medium';
    
    switch (options.format) {
      case 'pdf':
        if (options.includeCharts) {
          await this.exportToPDF('dashboard-content', `dashboard-${timestamp}.pdf`, currency);
        }
        break;
      case 'png':
        if (options.includeCharts) {
          await this.exportToPNG('dashboard-content', `dashboard-${timestamp}.png`, currency);
        }
        break;
      case 'csv':
        if (options.includeData) {
          this.exportToCSV(data, `dashboard-data-${timestamp}.csv`);
        }
        break;
      case 'json':
        if (options.includeData) {
          this.exportToJSON(data, `dashboard-data-${timestamp}.json`);
        }
        break;
    }
  }
}