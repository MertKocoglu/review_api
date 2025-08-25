import fs from 'fs';
import path from 'path';
import { ReviewData } from './reviewService';
import { AppStoreReviewData } from './appStoreService';

export interface CSVExportOptions {
  appId: string;
  filename?: string;
  outputDir?: string;
  platform?: 'google-play' | 'app-store';
}

export class CSVService {
  private static readonly DEFAULT_OUTPUT_DIR = 'exports';

  async exportReviewsToCSV(reviews: ReviewData[], options: CSVExportOptions): Promise<string> {
    try {
      const {
        appId,
        filename = `${appId}_reviews_${Date.now()}.csv`,
        outputDir = CSVService.DEFAULT_OUTPUT_DIR
      } = options;

      const fullOutputDir = path.resolve(outputDir);
      if (!fs.existsSync(fullOutputDir)) {
        fs.mkdirSync(fullOutputDir, { recursive: true });
      }

      const filePath = path.join(fullOutputDir, filename);

      const csvHeader = [
        'id',
        'userName',
        'content',
        'score',
        'date',
        'thumbsUp',
        'version'
      ].join(';;');

      const csvRows = reviews.map(review => [
        this.escapeCsvField(review.id),
        this.escapeCsvField(review.userName),
        this.escapeCsvField(review.text),
        review.score,
        this.escapeCsvField(review.date),
        review.thumbsUp,
        this.escapeCsvField(review.version || '')
      ].join(';;'));

      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync(filePath, csvContent, 'utf8');

      return filePath;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error(`Failed to export reviews to CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exportAppStoreReviewsToCSV(reviews: AppStoreReviewData[], options: CSVExportOptions): Promise<string> {
    try {
      const {
        appId,
        filename = `appstore_${appId}_reviews_${Date.now()}.csv`,
        outputDir = CSVService.DEFAULT_OUTPUT_DIR
      } = options;

      const fullOutputDir = path.resolve(outputDir);
      if (!fs.existsSync(fullOutputDir)) {
        fs.mkdirSync(fullOutputDir, { recursive: true });
      }

      const filePath = path.join(fullOutputDir, filename);

      const csvHeader = [
        'id',
        'userName',
        'title',
        'content',
        'score',
        'version',
        'date'
      ].join(';;');

      const csvRows = reviews.map(review => [
        this.escapeCsvField(review.id),
        this.escapeCsvField(review.userName),
        this.escapeCsvField(review.title),
        this.escapeCsvField(review.text),
        review.score,
        this.escapeCsvField(review.version),
        this.escapeCsvField(review.date)
      ].join(';;'));

      const csvContent = [csvHeader, ...csvRows].join('\n');
      fs.writeFileSync(filePath, csvContent, 'utf8');

      return filePath;
    } catch (error) {
      console.error('Error exporting App Store reviews to CSV:', error);
      throw new Error(`Failed to export App Store reviews to CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getExportStats(filePath: string) {
    try {
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length - 1;
      
      return {
        filePath,
        fileName: path.basename(filePath),
        fileSize: stats.size,
        fileSizeFormatted: this.formatFileSize(stats.size),
        reviewCount: lines - 1,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      throw new Error(`Failed to get export statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  listExports(outputDir = CSVService.DEFAULT_OUTPUT_DIR) {
    try {
      const fullOutputDir = path.resolve(outputDir);
      
      if (!fs.existsSync(fullOutputDir)) {
        return [];
      }

      const files = fs.readdirSync(fullOutputDir)
        .filter(file => file.endsWith('.csv'))
        .map(file => {
          const filePath = path.join(fullOutputDir, file);
          const stats = fs.statSync(filePath);
          return {
            fileName: file,
            filePath,
            fileSize: stats.size,
            fileSizeFormatted: this.formatFileSize(stats.size),
            createdAt: stats.birthtime,
            modifiedAt: stats.mtime
          };
        })
        .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());

      return files;
    } catch (error) {
      throw new Error(`Failed to list exports: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  extractAppIdFromUrl(url: string): string | null {
    try {
      const regex = /[?&]id=([^&]+)/;
      const match = url.match(regex);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }

  extractAppStoreIdFromUrl(url: string): string | null {
    try {
      const patterns = [
        /\/id(\d+)/,
        /\/app\/[^\/]+\/id(\d+)/,
        /\/app\/id(\d+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('Error extracting App Store app ID:', error);
      return null;
    }
  }

  private escapeCsvField(field: string | undefined | null): string {
    // Handle null/undefined values
    if (field === null || field === undefined) return 'Null';
    
    const original = String(field);
    
    // Handle empty strings or strings with only whitespace
    if (original === '' || original.trim() === '') return 'Nan';
    
    // Remove emojis and other unicode symbols
    let escaped = this.removeEmojis(original);
    
    // If after emoji removal, field becomes empty, return empty string
    if (!escaped || escaped.trim() === '') return '';
    
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
      escaped = '"' + escaped.replace(/"/g, '""') + '"';
    }
    
    return escaped;
  }

  private removeEmojis(text: string): string {
    // Remove emojis and unicode symbols using comprehensive regex
    return text
      // Remove standard emojis (U+1F600-U+1F64F, U+1F300-U+1F5FF, U+1F680-U+1F6FF, U+1F1E0-U+1F1FF)
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
      // Remove miscellaneous symbols and pictographs
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      // Remove dingbats
      .replace(/[\u{2701}-\u{27BE}]/gu, '')
      // Remove additional emoji ranges
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
      // Remove variation selectors
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
      // Remove combining characters that might be part of emojis
      .replace(/[\u{20D0}-\u{20FF}]/gu, '')
      // Remove zero-width joiners used in emoji sequences
      .replace(/\u{200D}/gu, '')
      // Clean up multiple spaces and trim
      .replace(/\s+/g, ' ')
      .trim();
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
