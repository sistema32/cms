/**
 * SEO Monitoring - Phase 7
 * Track rankings, Core Web Vitals, Search Console integration
 */

export interface SEORanking {
  keyword: string;
  position: number;
  url: string;
  searchVolume?: number;
  previousPosition?: number;
  change?: number;
  date: Date;
}

export interface WebVitalsReport {
  url: string;
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  deviceType: "mobile" | "desktop";
  timestamp: Date;
}

export class SEOMonitoring {
  private static instance: SEOMonitoring;

  static getInstance(): SEOMonitoring {
    if (!SEOMonitoring.instance) {
      SEOMonitoring.instance = new SEOMonitoring();
    }
    return SEOMonitoring.instance;
  }

  /**
   * Track web vitals metric
   */
  async trackWebVitals(metric: {
    name: string;
    value: number;
    rating: string;
    url: string;
  }): Promise<void> {
    // In production, would store in database
    console.log(`Web Vitals - ${metric.name}: ${metric.value} (${metric.rating})`);

    // Send to analytics service
    // await fetch('/api/analytics/web-vitals', {
    //   method: 'POST',
    //   body: JSON.stringify(metric),
    // });
  }

  /**
   * Generate SEO health score
   */
  calculateHealthScore(metrics: {
    indexedPages: number;
    totalPages: number;
    avgLCP: number;
    avgFID: number;
    avgCLS: number;
    crawlErrors: number;
    brokenLinks: number;
    avgLoadTime: number;
  }): { score: number; grade: string; issues: string[] } {
    let score = 100;
    const issues: string[] = [];

    // Indexation score (30 points)
    const indexationRate = (metrics.indexedPages / metrics.totalPages) * 100;
    if (indexationRate < 50) {
      score -= 30;
      issues.push("Low indexation rate (< 50%)");
    } else if (indexationRate < 80) {
      score -= 15;
      issues.push("Moderate indexation rate (< 80%)");
    }

    // Core Web Vitals score (40 points)
    if (metrics.avgLCP > 2.5) {
      score -= 15;
      issues.push("Poor LCP (> 2.5s)");
    } else if (metrics.avgLCP > 2.0) {
      score -= 5;
      issues.push("Needs LCP improvement");
    }

    if (metrics.avgFID > 100) {
      score -= 10;
      issues.push("Poor FID (> 100ms)");
    }

    if (metrics.avgCLS > 0.1) {
      score -= 15;
      issues.push("Poor CLS (> 0.1)");
    }

    // Crawl errors (20 points)
    if (metrics.crawlErrors > 50) {
      score -= 20;
      issues.push("Many crawl errors (> 50)");
    } else if (metrics.crawlErrors > 10) {
      score -= 10;
      issues.push("Some crawl errors detected");
    }

    // Broken links (10 points)
    if (metrics.brokenLinks > 20) {
      score -= 10;
      issues.push("Many broken links (> 20)");
    } else if (metrics.brokenLinks > 5) {
      score -= 5;
      issues.push("Some broken links found");
    }

    score = Math.max(0, score);

    const grade =
      score >= 90 ? "A+" :
      score >= 80 ? "A" :
      score >= 70 ? "B" :
      score >= 60 ? "C" :
      score >= 50 ? "D" : "F";

    return { score, grade, issues };
  }

  /**
   * Generate SEO report
   */
  generateReport(data: {
    period: string;
    rankings: SEORanking[];
    webVitals: WebVitalsReport[];
    organicTraffic: { sessions: number; pageviews: number; avgDuration: number };
    topPages: Array<{ url: string; views: number; avgPosition: number }>;
    topKeywords: Array<{ keyword: string; position: number; clicks: number; impressions: number }>;
  }): string {
    return `
# SEO Performance Report - ${data.period}

## 🎯 Key Metrics

### Organic Traffic
- Sessions: ${data.organicTraffic.sessions}
- Pageviews: ${data.organicTraffic.pageviews}
- Avg Duration: ${data.organicTraffic.avgDuration}s

### Core Web Vitals (Average)
- LCP: ${this.calculateAverage(data.webVitals.map(v => v.lcp)).toFixed(2)}s
- FID: ${this.calculateAverage(data.webVitals.map(v => v.fid)).toFixed(2)}ms
- CLS: ${this.calculateAverage(data.webVitals.map(v => v.cls)).toFixed(3)}

## 📊 Top Performing Pages
${data.topPages.map((page, i) =>
  `${i + 1}. ${page.url} - ${page.views} views (Avg Pos: ${page.avgPosition})`
).join('\n')}

## 🔑 Top Keywords
${data.topKeywords.map((kw, i) =>
  `${i + 1}. "${kw.keyword}" - Pos ${kw.position} (${kw.clicks} clicks, ${kw.impressions} imp)`
).join('\n')}

## 📈 Ranking Changes
${data.rankings.map(rank => {
  const change = rank.change || 0;
  const arrow = change > 0 ? "↑" : change < 0 ? "↓" : "→";
  return `${arrow} "${rank.keyword}": Position ${rank.position} (${change > 0 ? '+' : ''}${change})`;
}).join('\n')}
`.trim();
  }

  /**
   * Calculate average
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  /**
   * Check for broken links
   */
  async checkBrokenLinks(urls: string[]): Promise<Array<{ url: string; status: number; error?: string }>> {
    const results: Array<{ url: string; status: number; error?: string }> = [];

    for (const url of urls) {
      try {
        const response = await fetch(url, { method: "HEAD" });
        results.push({
          url,
          status: response.status,
          error: response.status >= 400 ? `HTTP ${response.status}` : undefined,
        });
      } catch (error) {
        results.push({
          url,
          status: 0,
          error: String(error),
        });
      }
    }

    return results;
  }

  /**
   * Generate Google Search Console report URL
   */
  generateSearchConsoleUrl(siteUrl: string, params?: {
    page?: string;
    query?: string;
    dateRange?: string;
  }): string {
    const base = "https://search.google.com/search-console";
    const encodedSite = encodeURIComponent(siteUrl);
    let url = `${base}/performance/search-analytics?resource_id=${encodedSite}`;

    if (params?.page) url += `&page=${encodeURIComponent(params.page)}`;
    if (params?.query) url += `&query=${encodeURIComponent(params.query)}`;
    if (params?.dateRange) url += `&date_range=${params.dateRange}`;

    return url;
  }
}

export const seoMonitoring = SEOMonitoring.getInstance();
