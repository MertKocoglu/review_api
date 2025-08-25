import { Router, Request, Response } from 'express';
import { ReviewService, ReviewOptions } from '../services/reviewService';
import { AppStoreService } from '../services/appStoreService';
import { CSVService } from '../services/csvService';

const router = Router();
const reviewService = new ReviewService();
const appStoreService = new AppStoreService();
const csvService = new CSVService();

/**
 * GET /api/reviews/search
 * Search for apps in Google Play Store
 * Query parameters:
 * - q: Search query (required)
 * - num: Number of results (default: 20, max: 50)
 * - lang: Language code (default: 'tr')
 * - country: Country code (default: 'tr')
 * - price: Price filter - 'all', 'free', 'paid' (default: 'all')
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      q,
      num = '20',
      lang = 'tr',
      country = 'tr',
      price = 'all'
    } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Search query (q) is required'
      });
    }

    const numResults = Math.max(parseInt(num as string) || 20, 1);
    const validPrices = ['all', 'free', 'paid'];
    const priceFilter = validPrices.includes(price as string) ? price as 'all' | 'free' | 'paid' : 'all';

    const results = await reviewService.searchApps(q, {
      num: numResults,
      lang: lang as string,
      country: country as string,
      price: priceFilter
    });

    res.json({
      success: true,
      data: results,
      meta: {
        query: q,
        requestedCount: numResults,
        actualCount: results.length,
        lang,
        country,
        price: priceFilter,
        searchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({
      error: 'Failed to search apps',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/reviews/exports
 * List all exported CSV files
 */
router.get('/exports', async (req: Request, res: Response) => {
  try {
    const exports = csvService.listExports();

    res.json({
      success: true,
      data: exports,
      meta: {
        totalExports: exports.length,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in exports list endpoint:', error);
    res.status(500).json({
      error: 'Failed to list exports',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/reviews/:appId
 * Get reviews for a specific app
 * Query parameters:
 * - lang: Language code (default: 'tr')
 * - country: Country code (default: 'tr')
 * - sort: Sort order - 'newest', 'rating', 'helpfulness' (default: 'newest')
 * - num: Number of reviews to fetch (default: 100, max: 200)
 * - paginate: Enable pagination (default: true)
 * - nextPaginationToken: Token for next page
 */
router.get('/:appId', async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const {
      lang = 'tr',
      country = 'tr',
      sort = 'newest',
      num = '100',
      paginate = 'true',
      nextPaginationToken
    } = req.query;

    // Validate appId
    if (!appId || typeof appId !== 'string') {
      return res.status(400).json({
        error: 'Invalid app ID',
        message: 'App ID is required and must be a valid string'
      });
    }

    // Validate and parse num parameter
    const numReviews = Math.max(parseInt(num as string) || 100, 1); // Minimum 1, no maximum limit
    
    // Validate sort parameter
    const validSorts = ['newest', 'rating', 'helpfulness'];
    const sortOrder = validSorts.includes(sort as string) ? sort as 'newest' | 'rating' | 'helpfulness' : 'newest';

    const options: ReviewOptions = {
      appId,
      lang: lang as string,
      country: country as string,
      sort: sortOrder,
      num: numReviews,
      paginate: paginate === 'true',
      nextPaginationToken: nextPaginationToken as string
    };

    const result = await reviewService.getReviews(options);

    res.json({
      success: true,
      data: result,
      meta: {
        appId,
        requestedCount: numReviews,
        actualCount: result.reviews.length,
        hasNextPage: !!result.nextPaginationToken,
        sort: sortOrder,
        lang,
        country
      }
    });

  } catch (error) {
    console.error('Error in reviews endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch reviews',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/reviews/:appId/info
 * Get detailed app information
 */
router.get('/:appId/info', async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const { lang = 'tr', country = 'tr' } = req.query;

    if (!appId || typeof appId !== 'string') {
      return res.status(400).json({
        error: 'Invalid app ID',
        message: 'App ID is required and must be a valid string'
      });
    }

    const appInfo = await reviewService.getAppInfo(appId, lang as string, country as string);

    res.json({
      success: true,
      data: appInfo,
      meta: {
        appId,
        lang,
        country,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in app info endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch app information',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/reviews/export/csv
 * Export reviews to CSV format
 * Body parameters:
 * - url: Google Play Store URL (required)
 * - num: Number of reviews to export (default: 500, no limit)
 * - lang: Language code (default: 'tr')
 * - country: Country code (default: 'tr')
 * - sort: Sort order (default: 'newest')
 */
router.post('/export/csv', async (req: Request, res: Response) => {
  try {
    const {
      url,
      num = '500',
      lang = 'tr',
      country = 'tr',
      sort = 'newest'
    } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Invalid Google Play URL',
        message: 'Google Play Store URL is required'
      });
    }

    // Extract app ID from URL
    const appId = csvService.extractAppIdFromUrl(url);
    if (!appId) {
      return res.status(400).json({
        error: 'Invalid Google Play URL',
        message: 'Could not extract app ID from the provided URL'
      });
    }

    const numReviews = Math.max(parseInt(num as string) || 500, 1); // Minimum 1, no maximum limit
    const validSorts = ['newest', 'rating', 'helpfulness'];
    const sortOrder = validSorts.includes(sort as string) ? sort as 'newest' | 'rating' | 'helpfulness' : 'newest';

    // Fetch reviews
    const options: ReviewOptions = {
      appId,
      lang: lang as string,
      country: country as string,
      sort: sortOrder,
      num: numReviews,
      paginate: false // Don't paginate for CSV export
    };

    const reviewData = await reviewService.getReviews(options);

    if (reviewData.reviews.length === 0) {
      return res.status(404).json({
        error: 'No reviews found',
        message: 'No reviews found for the specified app'
      });
    }

    // Export to CSV
    const filePath = await csvService.exportReviewsToCSV(reviewData.reviews, {
      appId,
      filename: `${appId}_reviews_${Date.now()}.csv`
    });

    const stats = csvService.getExportStats(filePath);

    res.json({
      success: true,
      data: {
        message: 'Reviews exported successfully',
        exportInfo: stats,
        reviewCount: reviewData.reviews.length,
        appId,
        downloadUrl: `/api/reviews/download/${stats.fileName}`
      },
      meta: {
        url,
        appId,
        requestedCount: numReviews,
        actualCount: reviewData.reviews.length,
        sort: sortOrder,
        lang,
        country,
        exportedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in CSV export endpoint:', error);
    res.status(500).json({
      error: 'Failed to export reviews',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/reviews/download/:filename
 * Download exported CSV file
 */
router.get('/download/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    
    if (!filename || !filename.endsWith('.csv')) {
      return res.status(400).json({
        error: 'Invalid filename',
        message: 'Filename must be a valid CSV file'
      });
    }

    const filePath = `exports/${filename}`;
    
    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested CSV file does not exist'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send file
    res.sendFile(filePath, { root: '.' });

  } catch (error) {
    console.error('Error in download endpoint:', error);
    res.status(500).json({
      error: 'Failed to download file',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/reviews/appstore/search
 * Search for apps in iOS App Store
 * Query parameters:
 * - q: Search query (required)
 * - num: Number of results (default: 20, max: 50)
 * - country: Country code (default: 'tr')
 */
router.get('/appstore/search', async (req: Request, res: Response) => {
  try {
    const {
      q,
      num = '20',
      country = 'tr'
    } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Search query (q) is required'
      });
    }

    const numResults = Math.max(parseInt(num as string) || 20, 1);

    const results = await appStoreService.searchApps(q, {
      num: numResults,
      country: country as string
    });

    res.json({
      success: true,
      data: results,
      meta: {
        query: q,
        requestedCount: numResults,
        actualCount: results.length,
        country,
        platform: 'appstore',
        searchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in App Store search endpoint:', error);
    res.status(500).json({
      error: 'Failed to search App Store apps',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/reviews/appstore/:appId
 * Get reviews for a specific app from iOS App Store
 * Path parameters:
 * - appId: App Store app ID (required)
 * Query parameters:
 * - num: Number of reviews to fetch (default: 100, max: 500)
 * - country: Country code (default: 'tr')
 * - sort: Sort order - 'mostRecent', 'mostHelpful' (default: 'mostRecent')
 */
router.get('/appstore/:appId', async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const {
      num = '100',
      country = 'tr',
      sort = 'mostRecent'
    } = req.query;

    if (!appId || typeof appId !== 'string') {
      return res.status(400).json({
        error: 'Invalid app ID',
        message: 'App Store app ID is required and must be a valid string'
      });
    }

    const numReviews = Math.max(parseInt(num as string) || 100, 1); // Minimum 1, no maximum limit
    const validSorts = ['mostRecent', 'mostHelpful'];
    const sortOrder = validSorts.includes(sort as string) ? sort as 'mostRecent' | 'mostHelpful' : 'mostRecent';

    let reviewData;
    if (numReviews <= 50) {
      // Single page request
      reviewData = await appStoreService.getReviews({
        appId,
        country: country as string,
        sort: sortOrder
      });
    } else {
      // Multi-page request
      reviewData = await appStoreService.getReviewsWithPagination({
        appId,
        country: country as string,
        sort: sortOrder,
        totalReviews: numReviews
      });
    }

    res.json({
      success: true,
      data: reviewData.reviews,
      meta: {
        appId,
        requestedCount: numReviews,
        actualCount: reviewData.reviews.length,
        hasMore: reviewData.hasMore,
        sort: sortOrder,
        country,
        platform: 'appstore',
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in App Store reviews endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch App Store reviews',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * GET /api/reviews/appstore/:appId/info
 * Get detailed app information from iOS App Store
 */
router.get('/appstore/:appId/info', async (req: Request, res: Response) => {
  try {
    const { appId } = req.params;
    const { country = 'tr' } = req.query;

    if (!appId || typeof appId !== 'string') {
      return res.status(400).json({
        error: 'Invalid app ID',
        message: 'App Store app ID is required and must be a valid string'
      });
    }

    const appInfo = await appStoreService.getAppInfo(appId, country as string);

    res.json({
      success: true,
      data: appInfo,
      meta: {
        appId,
        country,
        platform: 'appstore',
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in App Store app info endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch App Store app information',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

/**
 * POST /api/reviews/appstore/export/csv
 * Export App Store reviews to CSV format
 * Body parameters:
 * - url: App Store URL (required)
 * - num: Number of reviews to export (default: 500, no limit)
 * - country: Country code (default: 'tr')
 * - sort: Sort order (default: 'mostRecent')
 */
router.post('/appstore/export/csv', async (req: Request, res: Response) => {
  try {
    const {
      url,
      num = '500',
      country = 'tr',
      sort = 'mostRecent'
    } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        error: 'Invalid App Store URL',
        message: 'App Store URL is required'
      });
    }

    // Extract app ID from URL
    const appId = csvService.extractAppStoreIdFromUrl(url);
    if (!appId) {
      return res.status(400).json({
        error: 'Invalid App Store URL',
        message: 'Could not extract app ID from the provided URL'
      });
    }

    const numReviews = Math.max(parseInt(num as string) || 500, 1); // Minimum 1, no maximum limit
    const validSorts = ['mostRecent', 'mostHelpful'];
    const sortOrder = validSorts.includes(sort as string) ? sort as 'mostRecent' | 'mostHelpful' : 'mostRecent';

    // Fetch reviews
    let reviewData;
    if (numReviews <= 50) {
      reviewData = await appStoreService.getReviews({
        appId,
        country: country as string,
        sort: sortOrder
      });
    } else {
      reviewData = await appStoreService.getReviewsWithPagination({
        appId,
        country: country as string,
        sort: sortOrder,
        totalReviews: numReviews
      });
    }

    if (reviewData.reviews.length === 0) {
      return res.status(404).json({
        error: 'No reviews found',
        message: 'No reviews found for the specified App Store app'
      });
    }

    // Export to CSV
    const filePath = await csvService.exportAppStoreReviewsToCSV(reviewData.reviews, {
      appId,
      platform: 'app-store',
      filename: `appstore_${appId}_reviews_${Date.now()}.csv`
    });

    const stats = csvService.getExportStats(filePath);

    res.json({
      success: true,
      data: {
        message: 'App Store reviews exported successfully',
        exportInfo: stats,
        reviewCount: reviewData.reviews.length,
        appId,
        downloadUrl: `/api/reviews/download/${stats.fileName}`
      },
      meta: {
        url,
        appId,
        requestedCount: numReviews,
        actualCount: reviewData.reviews.length,
        sort: sortOrder,
        country,
        platform: 'appstore',
        exportedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in App Store CSV export endpoint:', error);
    res.status(500).json({
      error: 'Failed to export App Store reviews',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;
