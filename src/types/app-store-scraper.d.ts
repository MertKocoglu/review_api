declare module 'app-store-scraper' {
  interface ReviewResult {
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

  interface AppResult {
    id: string;
    bundleId: string;
    title: string;
    description: string;
    summary: string;
    url: string;
    icon: string;
    screenshots: string[];
    developer: string;
    developerId: string;
    developerUrl: string;
    developerWebsite: string;
    genre: string;
    genreId: string;
    price: number;
    currency: string;
    free: boolean;
    version: string;
    released: string;
    updated: string;
    releaseNotes: string;
    currentVersionReleaseDate: string;
    score: number;
    reviews: number;
    ratings: number;
    histogram: { [key: string]: number };
    size: string;
    contentRating: string;
    languages: string[];
    requiredOsVersion: string;
  }

  interface SearchResult {
    id: string;
    bundleId: string;
    title: string;
    developer: string;
    developerId: string;
    icon: string;
    score: number;
    scoreText: string;
    price: number;
    currency: string;
    free: boolean;
    genre: string;
    genreId: string;
  }

  interface ReviewOptions {
    id: string;
    country?: string;
    page?: number;
    sort?: string;
  }

  interface AppOptions {
    id: string;
    country?: string;
  }

  interface SearchOptions {
    term: string;
    num?: number;
    country?: string;
    media?: string;
  }

  const sort: {
    RECENT: string;
    HELPFUL: string;
  };

  function reviews(options: ReviewOptions): Promise<ReviewResult[]>;
  function app(options: AppOptions): Promise<AppResult>;
  function search(options: SearchOptions): Promise<SearchResult[]>;

  export = {
    reviews,
    app,
    search,
    sort
  };
}
