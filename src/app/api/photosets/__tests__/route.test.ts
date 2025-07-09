import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

const { mockFlickr } = vi.hoisted(() => {
  return { mockFlickr: vi.fn() };
});

// Mock flickr-sdk
vi.mock('flickr-sdk', () => ({
  createFlickr: vi.fn(() => ({
    flickr: mockFlickr,
  })),
}));

// Mock Upstash Ratelimit and Redis
const mockRateLimit = vi.fn();
const mockSlidingWindow = vi.fn();
vi.mock('@upstash/ratelimit', () => {
  const RatelimitMock = vi.fn().mockImplementation(() => ({
    limit: mockRateLimit,
    slidingWindow: mockSlidingWindow,
  }));
  return { Ratelimit: RatelimitMock };
});
vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => ({})),
  },
}));

describe('GET /api/photosets', () => {
  beforeEach(() => {
    process.env.FLICKR_USER_ID = 'test-user-id';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.FLICKR_USER_ID;
  });

  it('should return a list of photosets on success', async () => {
    mockRateLimit.mockResolvedValue({ success: true });
    const mockPhotosetsResponse = {
      photosets: {
        photoset: [{ id: '1', title: { _content: 'Test Set' } }],
      },
    };
    mockFlickr.mockResolvedValue(mockPhotosetsResponse);

    const request = new Request('http://localhost/api/photosets');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(mockPhotosetsResponse.photosets.photoset);
    expect(mockFlickr).toHaveBeenCalledWith('flickr.photosets.getList', {
      user_id: 'test-user-id',
      primary_photo_extras: 'url_m',
    });
    expect(mockRateLimit).toHaveBeenCalledWith('127.0.0.1');
  });

  it('should return 429 if rate limited', async () => {
    mockRateLimit.mockResolvedValue({ success: false });

    const request = new Request('http://localhost/api/photosets', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    });
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({ error: 'Too many requests' });
    expect(mockRateLimit).toHaveBeenCalledWith('1.2.3.4');
    expect(mockFlickr).not.toHaveBeenCalled();
  });

  it('should return 500 if Flickr API fails', async () => {
    mockRateLimit.mockResolvedValue({ success: true });
    mockFlickr.mockRejectedValue(new Error('Flickr API Error'));

    const request = new Request('http://localhost/api/photosets');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({ error: 'Failed to fetch photosets' });
  });
});
