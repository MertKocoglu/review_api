import gplay from 'google-play-scraper';

export interface ReviewData {
  id: string;
  userName: string;
  userImage?: string;
  date: string;
  score: number;
  scoreText: string;
  url: string;
  text: string;
  replyDate?: string;
  replyText?: string;
  version?: string;
  thumbsUp: number;
}

export interface ReviewOptions {
  appId: string;
  lang?: string;
  country?: string;
  sort?: 'newest' | 'rating' | 'helpfulness';
  num?: number;
  paginate?: boolean;
  nextPaginationToken?: string;
}

export interface ReviewResponse {
  reviews: ReviewData[];
  nextPaginationToken?: string;
  totalCount?: number;
}

export class ReviewService {
  /**
   * Get reviews for a specific app from Google Play Store
   * @param options Review fetching options
   * @returns Promise<ReviewResponse>
   */
  async getReviews(options: ReviewOptions): Promise<ReviewResponse> {
    try {
      const { num = 100 } = options;

      // For large datasets, fetch in batches
      if (num > 200) {
        return this.fetchLargeDataset(options);
      }

      // For smaller datasets, use single batch
      return this.fetchSingleBatch(options);

    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw new Error(`Failed to fetch reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch large datasets by making multiple paginated requests
   * @param options Review fetching options
   * @returns Promise<ReviewResponse>
   */
  private async fetchLargeDataset(options: ReviewOptions): Promise<ReviewResponse> {
    const {
      appId,
      lang = 'tr',
      country = 'tr',
      sort = 'newest',
      num = 100
    } = options;

    const allReviews: ReviewData[] = [];
    let nextToken: string | undefined;
    let fetchedCount = 0;
    const batchSize = 200; // Maximum per request
    
    console.log(`Fetching ${num} reviews in batches of ${batchSize}...`);

    while (fetchedCount < num) {
      const remainingCount = num - fetchedCount;
      const currentBatchSize = Math.min(remainingCount, batchSize);

      console.log(`Fetching batch: ${fetchedCount + 1} to ${fetchedCount + currentBatchSize}`);

      // Call the base reviews method directly, bypassing the large dataset check
      const batchResult = await this.fetchSingleBatch({
        appId,
        lang,
        country,
        sort,
        num: currentBatchSize,
        paginate: true,
        nextPaginationToken: nextToken
      });

      if (batchResult.reviews.length === 0) {
        console.log('No more reviews available - API returned empty batch');
        break;
      }

      allReviews.push(...batchResult.reviews);
      fetchedCount += batchResult.reviews.length;
      nextToken = batchResult.nextPaginationToken;

      console.log(`✅ Batch completed: ${batchResult.reviews.length} reviews fetched, Total: ${allReviews.length}`);

      // If no more pagination token, we've reached the end
      if (!nextToken) {
        console.log('🏁 Reached end of available reviews - No more pagination tokens available');
        break;
      }

      // Add a small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Successfully fetched ${allReviews.length} reviews`);

    return {
      reviews: allReviews,
      nextPaginationToken: nextToken,
      totalCount: allReviews.length
    };
  }

  /**
   * Fetch a single batch of reviews without large dataset handling
   * @param options Review fetching options
   * @returns Promise<ReviewResponse>
   */
  private async fetchSingleBatch(options: ReviewOptions): Promise<ReviewResponse> {
    try {
      const {
        appId,
        lang = 'tr',
        country = 'tr',
        sort = 'newest',
        num = 100,
        paginate = true,
        nextPaginationToken
      } = options;

      const reviewOptions: any = {
        appId,
        lang,
        country,
        sort: this.mapSortOption(sort),
        num: Math.min(num, 200), // Google Play API limitation per request
        paginate
      };

      if (nextPaginationToken) {
        reviewOptions.nextPaginationToken = nextPaginationToken;
      }

      const result = await gplay.reviews(reviewOptions);

      return {
        reviews: result.data.map(this.mapReviewData),
        nextPaginationToken: result.nextPaginationToken,
        totalCount: result.data.length
      };

    } catch (error) {
      console.error('Error fetching single batch:', error);
      throw new Error(`Failed to fetch reviews batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get app information
   * @param appId Google Play Store app ID
   * @param options Additional options
   * @returns Promise with app information
   */
  async getAppInfo(appId: string, lang = 'tr', country = 'tr') {
    try {
      const appInfo = await gplay.app({
        appId,
        lang,
        country
      });

      return {
        appId: appInfo.appId,
        title: appInfo.title,
        description: appInfo.description,
        descriptionHTML: appInfo.descriptionHTML,
        summary: appInfo.summary,
        installs: appInfo.installs,
        minInstalls: appInfo.minInstalls,
        maxInstalls: appInfo.maxInstalls,
        score: appInfo.score,
        scoreText: appInfo.scoreText,
        ratings: appInfo.ratings,
        reviews: appInfo.reviews,
        histogram: appInfo.histogram,
        price: appInfo.price,
        free: appInfo.free,
        currency: appInfo.currency,
        priceText: appInfo.priceText,
        developer: appInfo.developer,
        developerId: appInfo.developerId,
        developerEmail: appInfo.developerEmail,
        developerWebsite: appInfo.developerWebsite,
        developerAddress: appInfo.developerAddress,
        genre: appInfo.genre,
        genreId: appInfo.genreId,
        contentRating: appInfo.contentRating,
        contentRatingDescription: appInfo.contentRatingDescription,
        released: appInfo.released,
        updated: appInfo.updated,
        version: appInfo.version,
        recentChanges: appInfo.recentChanges,
        comments: appInfo.comments
      };

    } catch (error) {
      console.error('Error fetching app info:', error);
      throw new Error(`Failed to fetch app info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for apps in Google Play Store
   * @param term Search term
   * @param options Search options
   * @returns Promise with search results
   */
  async searchApps(term: string, options?: { num?: number; lang?: string; country?: string; price?: 'all' | 'free' | 'paid' }) {
    try {
      const {
        num = 20,
        lang = 'tr',
        country = 'tr',
        price = 'all'
      } = options || {};

      const results = await gplay.search({
        term,
        num,
        lang,
        country,
        price
      });

      return results.map((app: any) => ({
        appId: app.appId,
        title: app.title,
        developer: app.developer,
        developerId: app.developerId,
        icon: app.icon,
        score: app.score,
        scoreText: app.scoreText,
        priceText: app.priceText,
        free: app.free
      }));

    } catch (error) {
      console.error('Error searching apps:', error);
      throw new Error(`Failed to search apps: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Map sort option to gplay format
   * @param sort Sort option
   * @returns Mapped sort value
   */
  private mapSortOption(sort: 'newest' | 'rating' | 'helpfulness'): number {
    switch (sort) {
      case 'newest':
        return gplay.sort.NEWEST;
      case 'rating':
        return gplay.sort.RATING;
      case 'helpfulness':
        return gplay.sort.HELPFULNESS;
      default:
        return gplay.sort.NEWEST;
    }
  }

  /**
   * Map review data to our interface
   * @param review Raw review data from gplay
   * @returns Mapped review data
   */
  private mapReviewData(review: any): ReviewData {
    return {
      id: review.id,
      userName: review.userName,
      userImage: review.userImage,
      date: review.date,
      score: review.score,
      scoreText: review.scoreText,
      url: review.url,
      text: review.text,
      replyDate: review.replyDate,
      replyText: review.replyText,
      version: review.version,
      thumbsUp: review.thumbsUp
    };
  }
}
