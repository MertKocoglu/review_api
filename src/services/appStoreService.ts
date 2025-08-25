import appStore from 'app-store-scraper';

export interface AppStoreReviewData {
  id: string;
  userName: string;
  userUrl?: string;
  version: string;
  score: number;
  title: string;
  text: string;
  url: string;
  date: string;
}

export interface AppStoreReviewOptions {
  appId: string;
  country?: string;
  page?: number;
  sort?: 'mostRecent' | 'mostHelpful';
}

export interface AppStoreReviewResponse {
  reviews: AppStoreReviewData[];
  hasMore: boolean;
  totalCount: number;
}

export class AppStoreService {
  /**
   * Get reviews for a specific app from iOS App Store
   * @param options Review fetching options
   * @returns Promise<AppStoreReviewResponse>
   */
  async getReviews(options: AppStoreReviewOptions): Promise<AppStoreReviewResponse> {
    try {
      const {
        appId,
        country = 'tr',
        page = 1,
        sort = 'mostRecent'
      } = options;

      const result = await appStore.reviews({
        id: appId,
        country,
        page,
        sort: this.mapSortOption(sort)
      });

      return {
        reviews: result.map(this.mapReviewData),
        hasMore: result.length === 50, // App Store returns max 50 reviews per page
        totalCount: result.length
      };

    } catch (error) {
      console.error('Error fetching App Store reviews:', error);
      throw new Error(`Failed to fetch App Store reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get multiple pages of reviews for large datasets
   * @param options Review fetching options with total count
   * @returns Promise<AppStoreReviewResponse>
   */
  async getReviewsWithPagination(options: AppStoreReviewOptions & { totalReviews: number }): Promise<AppStoreReviewResponse> {
    const {
      appId,
      country = 'tr',
      sort = 'mostRecent',
      totalReviews
    } = options;

    const allReviews: AppStoreReviewData[] = [];
    const reviewsPerPage = 50; // App Store limit
    const totalPages = Math.ceil(totalReviews / reviewsPerPage);
    
    console.log(`Fetching ${totalReviews} App Store reviews in ${totalPages} pages...`);

    for (let page = 1; page <= totalPages; page++) {
      console.log(`Fetching App Store page ${page}/${totalPages}...`);

      try {
        const pageResult = await this.getReviews({
          appId,
          country,
          page,
          sort
        });

        if (pageResult.reviews.length === 0) {
          console.log('No more App Store reviews available');
          break;
        }

        allReviews.push(...pageResult.reviews);

        // Stop if we've reached the desired number
        if (allReviews.length >= totalReviews) {
          allReviews.splice(totalReviews); // Trim to exact count
          break;
        }

        // If we didn't get a full page, there are no more reviews
        if (pageResult.reviews.length < reviewsPerPage) {
          console.log('Reached end of available App Store reviews');
          break;
        }

        // Add delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error fetching App Store page ${page}:`, error);
        // Continue with next page instead of failing completely
        continue;
      }
    }

    console.log(`Successfully fetched ${allReviews.length} App Store reviews`);

    return {
      reviews: allReviews,
      hasMore: allReviews.length === totalReviews,
      totalCount: allReviews.length
    };
  }

  /**
   * Get app information from iOS App Store
   * @param appId App Store app ID
   * @param country Country code
   * @returns Promise with app information
   */
  async getAppInfo(appId: string, country = 'tr') {
    try {
      const appInfo = await appStore.app({
        id: appId,
        country
      });

      return {
        appId: appInfo.id,
        bundleId: appInfo.bundleId,
        title: appInfo.title,
        description: appInfo.description,
        summary: appInfo.summary,
        url: appInfo.url,
        icon: appInfo.icon,
        screenshots: appInfo.screenshots,
        developer: appInfo.developer,
        developerId: appInfo.developerId,
        developerUrl: appInfo.developerUrl,
        developerWebsite: appInfo.developerWebsite,
        genre: appInfo.genre,
        genreId: appInfo.genreId,
        price: appInfo.price,
        currency: appInfo.currency,
        free: appInfo.free,
        version: appInfo.version,
        released: appInfo.released,
        updated: appInfo.updated,
        releaseNotes: appInfo.releaseNotes,
        currentVersionReleaseDate: appInfo.currentVersionReleaseDate,
        score: appInfo.score,
        reviews: appInfo.reviews,
        ratings: appInfo.ratings,
        histogram: appInfo.histogram,
        size: appInfo.size,
        contentRating: appInfo.contentRating,
        languages: appInfo.languages,
        requiredOsVersion: appInfo.requiredOsVersion
      };

    } catch (error) {
      console.error('Error fetching App Store app info:', error);
      throw new Error(`Failed to fetch App Store app info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for apps in iOS App Store
   * @param term Search term
   * @param options Search options
   * @returns Promise with search results
   */
  async searchApps(term: string, options?: { num?: number; country?: string; media?: string }) {
    try {
      const {
        num = 20,
        country = 'tr',
        media = 'software'
      } = options || {};

      const results = await appStore.search({
        term,
        num,
        country,
        media
      });

      return results.map((app: any) => ({
        appId: app.id,
        bundleId: app.bundleId,
        title: app.title,
        developer: app.developer,
        developerId: app.developerId,
        icon: app.icon,
        score: app.score,
        scoreText: app.scoreText,
        price: app.price,
        currency: app.currency,
        free: app.free,
        genre: app.genre,
        genreId: app.genreId
      }));

    } catch (error) {
      console.error('Error searching App Store apps:', error);
      throw new Error(`Failed to search App Store apps: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract app ID from App Store URL
   * @param url App Store URL
   * @returns App ID or null
   */
  extractAppIdFromUrl(url: string): string | null {
    try {
      // App Store URL formats:
      // https://apps.apple.com/tr/app/whatsapp-messenger/id310633997
      // https://apps.apple.com/app/id310633997
      // https://itunes.apple.com/tr/app/whatsapp-messenger/id310633997

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

  /**
   * Map sort option to app-store-scraper format
   * @param sort Sort option
   * @returns Mapped sort value
   */
  private mapSortOption(sort: 'mostRecent' | 'mostHelpful'): string {
    switch (sort) {
      case 'mostRecent':
        return appStore.sort.RECENT;
      case 'mostHelpful':
        return appStore.sort.HELPFUL;
      default:
        return appStore.sort.RECENT;
    }
  }

  /**
   * Map review data to our interface
   * @param review Raw review data from app-store-scraper
   * @returns Mapped review data
   */
  private mapReviewData(review: any): AppStoreReviewData {
    return {
      id: review.id,
      userName: review.userName,
      userUrl: review.userUrl,
      version: review.version,
      score: review.score,
      title: review.title,
      text: review.text,
      url: review.url,
      date: review.date
    };
  }
}
