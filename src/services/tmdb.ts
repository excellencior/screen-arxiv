const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

const fetchFromTMDB = async (endpoint: string) => {
  const isV4Token = API_KEY && API_KEY.startsWith('eyJ');
  const url = isV4Token ? `${BASE_URL}${endpoint}` : `${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`;
  const options = isV4Token ? {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      accept: 'application/json'
    }
  } : {
    headers: {
      accept: 'application/json'
    }
  };

  const response = await fetch(url, options);
  return response;
};

export const fetchTrendingMovies = async () => {
  if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY') {
    return null;
  }
  try {
    const response = await fetchFromTMDB('/trending/movie/week');
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return null;
  }
};

export const fetchTrendingTV = async () => {
  if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY') {
    return null;
  }
  try {
    const response = await fetchFromTMDB('/trending/tv/week');
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching trending TV:', error);
    return null;
  }
};

const MOCK_SEARCH_RESULTS = [
  {
    id: 550,
    title: "Fight Club",
    media_type: "movie",
    release_date: "1999-10-15",
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground \"fight clubs\" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion."
  },
  {
    id: 1399,
    name: "Game of Thrones",
    media_type: "tv",
    first_air_date: "2011-04-17",
    poster_path: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
    overview: "Seven noble families fight for control of the mythical land of Westeros. Friction between the houses leads to full-scale war. All while a very ancient evil awakens in the farthest north. Amidst the war, a neglected military order of misfits, the Night's Watch, is all that stands between the realms of men and icy horrors beyond."
  },
  {
    id: 27205,
    title: "Inception",
    media_type: "movie",
    release_date: "2010-07-15",
    poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    overview: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious."
  },
  {
    id: 66732,
    name: "Stranger Things",
    media_type: "tv",
    first_air_date: "2016-07-15",
    poster_path: "/49WJfeN0moxb9IPfGn8xXKSg7Xf.jpg",
    overview: "When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl."
  }
];

export const searchMulti = async (query: string) => {
  if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY') {
    console.warn('TMDB API Key is missing. Returning mock data.');
    return MOCK_SEARCH_RESULTS.filter(item =>
    (item.title?.toLowerCase().includes(query.toLowerCase()) ||
      item.name?.toLowerCase().includes(query.toLowerCase()))
    );
  }
  try {
    const response = await fetchFromTMDB(`/search/multi?query=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.status_message || 'Failed to fetch from TMDB');
    }

    return data.results.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');
  } catch (error: any) {
    console.error('Error searching:', error);
    throw error;
  }
};

export const fetchMovieDetails = async (id: number) => {
  if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY') {
    console.warn('TMDB API Key is missing. Returning mock movie details.');
    return {
      id,
      overview: "This is a mock overview for the movie. Since the TMDB API key is missing, we are showing this placeholder text instead of the actual plot summary.",
      credits: {
        cast: [
          { name: "Actor One", character: "Lead Role" },
          { name: "Actor Two", character: "Supporting Role" }
        ]
      }
    };
  }
  try {
    const res = await fetchFromTMDB(`/movie/${id}?append_to_response=credits,videos`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Error fetching movie details:', e);
    return null;
  }
};

export const fetchTVDetails = async (id: number) => {
  if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY') {
    console.warn('TMDB API Key is missing. Returning mock TV details.');
    return {
      id,
      seasons: [
        { season_number: 1, name: "Season 1" }
      ]
    };
  }
  try {
    const res = await fetchFromTMDB(`/tv/${id}?append_to_response=videos`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Error fetching TV details:', e);
    return null;
  }
};

export const fetchTVSeason = async (id: number, seasonNumber: number) => {
  if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY') {
    console.warn('TMDB API Key is missing. Returning mock TV season.');
    return {
      id,
      episodes: [
        { id: id * 100 + 1, name: "Pilot", air_date: "2024-01-01", overview: "The journey begins as our heroes find themselves in a precarious situation.", guest_stars: [{ name: "Guest Star", character: "Mysterious Stranger" }] },
        { id: id * 100 + 2, name: "Episode 2", air_date: "2024-01-08", overview: "A sudden betrayal forces the group to re-evaluate their alliances.", guest_stars: [{ name: "Another Actor", character: "Villain" }] },
        { id: id * 100 + 3, name: "Episode 3", air_date: "2024-01-15", overview: "The climax of the first arc arrives with unexpected consequences.", guest_stars: [] }
      ]
    };
  }
  try {
    const res = await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error('Error fetching TV season:', e);
    return null;
  }
};

export const getImageUrl = (path: string, size: string = 'w500') => {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

let genreMapCache: Map<number, string> | null = null;

export const fetchGenreMap = async (): Promise<Map<number, string>> => {
  if (genreMapCache) return genreMapCache;

  const map = new Map<number, string>();

  if (!API_KEY || API_KEY === 'YOUR_TMDB_API_KEY') {
    // Fallback genres for demo mode
    [[28, 'Action'], [12, 'Adventure'], [16, 'Animation'], [35, 'Comedy'], [80, 'Crime'],
    [99, 'Documentary'], [18, 'Drama'], [10751, 'Family'], [14, 'Fantasy'], [36, 'History'],
    [27, 'Horror'], [10402, 'Music'], [9648, 'Mystery'], [10749, 'Romance'], [878, 'Sci-Fi'],
    [53, 'Thriller'], [10752, 'War'], [37, 'Western'], [10759, 'Action & Adventure'],
    [10765, 'Sci-Fi & Fantasy']].forEach(([id, name]) => map.set(id as number, name as string));
    genreMapCache = map;
    return map;
  }

  try {
    const [movieRes, tvRes] = await Promise.all([
      fetchFromTMDB('/genre/movie/list'),
      fetchFromTMDB('/genre/tv/list'),
    ]);
    const movieData = await movieRes.json();
    const tvData = await tvRes.json();
    for (const g of [...(movieData.genres || []), ...(tvData.genres || [])]) {
      map.set(g.id, g.name);
    }
  } catch (e) {
    console.error('Error fetching genre map:', e);
  }

  genreMapCache = map;
  return map;
};
