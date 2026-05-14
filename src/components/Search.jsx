import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from "./Search.module.css";

function Search({ initialQuery = "", onSearch, isShopSearchPage = false }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState(initialQuery || location.state?.query || "");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownContent, setDropdownContent] = useState('none');

  // Use refs
  const isMountedRef = useRef(true);
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const fetchIdRef = useRef(0);
  const localIndexRef = useRef({ names: [], locations: [] });

  // Build or refresh the local suggestions index (reusable)
  const buildLocalIndex = async () => {
    try {
      console.log('🗂️ Building local suggestions index...');
      const { data, error } = await supabase.from('shops').select('shopname, shoplocation').limit(500);
      if (error) throw error;
      if (data && data.length > 0) {
        const names = [];
        const locations = [];
        data.forEach((s) => {
          if (s.shopname) names.push(s.shopname);
          if (s.shoplocation) locations.push(s.shoplocation);
        });
        localIndexRef.current.names = Array.from(new Set(names));
        localIndexRef.current.locations = Array.from(new Set(locations));
        console.log('🗂️ Local index built:', { names: localIndexRef.current.names.length, locations: localIndexRef.current.locations.length });
  // local index sizes updated
      }
    } catch (err) {
      console.warn('⚠️ Could not build local index for suggestions:', err.message || err);
  // record error silently (no debug panel in production)
    }
  };

  // 🧠 Load recent searches
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("recentSearches")) || [];
    console.log("📂 Loaded recent searches:", saved);
    setRecentSearches(saved);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Debug state changes
  useEffect(() => {
    console.log("🔄 State Update:", {
      query,
      showDropdown,
      dropdownContent,
      suggestionsCount: suggestions.length,
      recentSearchesCount: recentSearches.length,
      loading
    });
  }, [query, showDropdown, dropdownContent, suggestions, recentSearches, loading]);
  // ✅ Handle external query updates
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setShowDropdown(false);
    }
  }, [initialQuery]);

  // Search executor (used by Enter, button, suggestion selection)
  const handleSearch = (searchTerm = query) => {
    console.log("🔍 Executing search for:", searchTerm);
    if (!searchTerm || !searchTerm.trim()) {
      console.log("⛔ Empty search term");
      return;
    }

    // cancel pending fetches/timeouts and clear UI
    fetchIdRef.current++;
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setShowDropdown(false);
    setSuggestions([]);
    setDropdownContent('none');

    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/ShopSearch?query=${encodeURIComponent(searchTerm)}`);
    }

    // Save to recent searches
    const updated = [searchTerm, ...recentSearches.filter((q) => q !== searchTerm)].slice(0, 6);
    console.log("💾 Saving to recent searches:", updated);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      console.log("↵ Enter key pressed");
      handleSearch();
    }
  };

  // 🧭 Fetch suggestions from Supabase
const fetchSuggestions = async (value) => {
  // Debug invocation
  const myFetchId = ++fetchIdRef.current; // increment and capture id for this fetch
  console.log("🔍 [fetchSuggestions] invoked:", { value, isMounted: isMountedRef.current, fetchId: myFetchId });

  if (!value || value.trim().length < 2) {
    console.log("📝 Query too short, clearing suggestions");
    setSuggestions([]);
    setDropdownContent('none');
    setShowDropdown(false);
    return;
  }

  setLoading(true);

  try {
    console.log("🚀 fetchSuggestions called for:", value);
    console.log('📚 Local index sizes:', {
      names: localIndexRef.current.names.length,
      locations: localIndexRef.current.locations.length,
    });

    // First, attempt to serve suggestions from the local index for speed and robustness
  try {
      const q = value.toLowerCase();
      const nameMatches = (localIndexRef.current.names || [])
        .filter(n => n.toLowerCase().includes(q))
        .slice(0, 6)
        .map(n => ({ type: 'shop', value: n, display: n }));

      const locMatches = (localIndexRef.current.locations || [])
        .filter(l => l.toLowerCase().includes(q))
        .slice(0, 6)
        .map(l => ({ type: 'location', value: l, display: l }));

      const localCombined = [...nameMatches, ...locMatches].slice(0, 6);
      console.log('🔎 Local matches counts:', { nameMatches: nameMatches.length, locMatches: locMatches.length, total: localCombined.length });
      if (localCombined.length > 0) {
        console.log('⚡ Using local index suggestions:', localCombined);
        // only apply results if this fetch is still the latest
        if (myFetchId === fetchIdRef.current) {
          setSuggestions(localCombined);
          setDropdownContent('suggestions');
          setShowDropdown(true);
    // source: local
        } else {
          console.log('⛔ Stale local results ignored (fetchId mismatch)', { myFetchId, current: fetchIdRef.current });
        }
        return;
      }
    } catch (err) {
      console.warn('⚠️ Local suggestions failed, falling back to remote:', err);
    }

    console.log("🚀 Falling back to Supabase for:", value);

    // Run ilike queries with column-name fallbacks. Try primary columns first, then alternates.
    const pattern = `%${value}%`;
    const nameCandidates = ['shopname', 'shop_name', 'name', 'title'];
    const locCandidates = ['shoplocation', 'shop_location', 'location', 'city'];

    const tryColumn = async (col) => {
      try {
        console.log(`🔎 Supabase: querying column '${col}' with pattern`, pattern);
        // select all so we can inspect alternative column names
        const res = await supabase.from('shops').select('*').ilike(col, pattern).limit(6);
        console.log(`🔔 response for '${col}' received; rows:`, res?.data?.length || 0, 'error:', res?.error || null);
        return res;
      } catch (err) {
        console.error(`💥 Error querying column '${col}':`, err);
        return { data: [], error: err };
      }
    };

    let nameRes = { data: [], error: null };
    let locRes = { data: [], error: null };

    // try primary candidates first
    nameRes = await tryColumn(nameCandidates[0]);
    locRes = await tryColumn(locCandidates[0]);

    let nameData = nameRes?.data || [];
    let locData = locRes?.data || [];
    let combined = [...nameData, ...locData];

    // If no combined results, try alternate name columns, then alternate location columns, then pairs
    if (!combined || combined.length === 0) {
      console.log('🔄 No remote results with primary columns, trying alternates...');

      // Try alternate name columns
      for (let i = 1; i < nameCandidates.length && (!combined || combined.length === 0); i++) {
        const res = await tryColumn(nameCandidates[i]);
        if (res?.data && res.data.length > 0) {
          nameRes = res;
          nameData = res.data;
          combined = [...nameData, ...locData];
          break;
        }
      }

      // Try alternate location columns
      for (let i = 1; i < locCandidates.length && (!combined || combined.length === 0); i++) {
        const res = await tryColumn(locCandidates[i]);
        if (res?.data && res.data.length > 0) {
          locRes = res;
          locData = res.data;
          combined = [...nameData, ...locData];
          break;
        }
      }

      // Try pair combinations if still empty
      for (let ni = 1; ni < nameCandidates.length && (!combined || combined.length === 0); ni++) {
        for (let li = 1; li < locCandidates.length && (!combined || combined.length === 0); li++) {
          const [nr, lr] = await Promise.all([tryColumn(nameCandidates[ni]), tryColumn(locCandidates[li])]);
          if ((nr?.data && nr.data.length > 0) || (lr?.data && lr.data.length > 0)) {
            if (nr?.data && nr.data.length > 0) { nameRes = nr; nameData = nr.data; }
            if (lr?.data && lr.data.length > 0) { locRes = lr; locData = lr.data; }
            combined = [...nameData, ...locData];
            break;
          }
        }
      }
    }

    console.log("📊 Supabase raw responses (after fallbacks):", { nameRes, locRes });

    const nameDataFinal = nameData || [];
    const locDataFinal = locData || [];

    const combinedFinal = [...nameDataFinal, ...locDataFinal];
  console.log('🔀 Combined remote rows count:', combinedFinal.length);
  // only update debug info if still current
  // update remote source count (production: no debug UI)

    // Helpers to normalize name/location keys from different schemas
    const getShopName = (s) => s?.shopname || s?.shop_name || s?.name || s?.title || '';
    const getShopLocation = (s) => s?.shoplocation || s?.shop_location || s?.location || s?.city || '';

    // Deduplicate using normalized keys
    const dedupedMap = new Map();
    combinedFinal.forEach((s) => {
      const key = `${getShopName(s)}||${getShopLocation(s)}`;
      if (!dedupedMap.has(key)) dedupedMap.set(key, s);
    });

    const data = Array.from(dedupedMap.values());

    console.log("📊 Merged Supabase data:", data);

    if (!data || data.length === 0) {
      console.warn("⚠️ No matches found in Supabase for:", value);
      // fallback mock suggestions
      const fallback = [
        { type: 'shop', value: 'Varma Textiles', display: 'Varma Textiles' },
        { type: 'location', value: 'Begumpet', display: 'Begumpet' },
      ];
      if (myFetchId === fetchIdRef.current) {
        setSuggestions(fallback);
        setDropdownContent('suggestions');
        setShowDropdown(true);
      } else console.log('⛔ Stale fallback ignored (fetchId mismatch)');
      return;
    }

    const allSuggestions = [];
    data.forEach((shop) => {
      if (shop.shopname)
        allSuggestions.push({ type: 'shop', value: shop.shopname, display: shop.shopname });
      if (shop.shoplocation)
        allSuggestions.push({ type: 'location', value: shop.shoplocation, display: shop.shoplocation });
    });

    const finalSuggestions = allSuggestions.filter(
      (item, i, arr) => arr.findIndex((x) => x.value === item.value) === i
    );

  console.log("🎯 Final unique suggestions:", finalSuggestions);

  // Extra debug: show what will be set for suggestions
  console.log('📝 Setting suggestions to:', finalSuggestions.map(s => ({ type: s.type, value: s.value })));

  if (myFetchId === fetchIdRef.current) {
    setSuggestions(finalSuggestions);
    setDropdownContent('suggestions');
    setShowDropdown(true);
  } else {
    console.log('⛔ Stale remote results ignored (fetchId mismatch)', { myFetchId, current: fetchIdRef.current });
  }

  } catch (err) {
    console.error("💥 Error fetching suggestions:", err.message || err);
    if (myFetchId === fetchIdRef.current) {
  // record error silently (no debug UI)
      // still show fallback mock data
      const mock = [
        { type: 'shop', value: 'Varma Textiles', display: 'Varma Textiles' },
        { type: 'location', value: 'Begumpet', display: 'Begumpet' },
      ];
      setSuggestions(mock);
      setDropdownContent('suggestions');
      setShowDropdown(true);
    } else {
      console.log('⛔ Stale error ignored (fetchId mismatch)');
    }
  } finally {
    // only clear loading if this is the latest fetch
    if (myFetchId === fetchIdRef.current) setLoading(false);
    console.log("🏁 Fetch complete (fetchId)", myFetchId, "current:", fetchIdRef.current, "showDropdown =", showDropdown, "content =", dropdownContent);
  }
};




  // ⏱️ Debounce typing
  useEffect(() => {
    console.log("⏰ Debounce effect triggered with query:", query);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      console.log("🔄 Cleared previous timeout");
    }

    // Show recent searches when input is focused and empty
    // NOTE: do not auto-show recent searches here; only show recent on input focus

    // Don't search for very short queries
    if (query.length < 2) {
      console.log("📝 Query too short, clearing suggestions");
      // cancel any pending fetch and clear UI
      fetchIdRef.current++;
      setSuggestions([]);
      setDropdownContent('none');
      setShowDropdown(false);
      return;
    }

    console.log("⏳ Setting new timeout for query:", query);
    timeoutRef.current = setTimeout(() => {
      console.log("🏃‍♂️ Timeout executed, calling fetchSuggestions for:", query);
      fetchSuggestions(query);
    }, 400);
    
    return () => {
      if (timeoutRef.current) {
        console.log("🧹 Cleaning up timeout");
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, recentSearches]);

  // Test connection on component mount
  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        console.log("🧪 Testing Supabase connection...");
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .limit(2);
        
        console.log("🧪 Connection test result:", { data, error });
        
        if (data && data.length > 0) {
          console.log("✅ Supabase connection successful. Sample data:", data);
        }
      } catch (err) {
        console.error("❌ Connection test failed:", err);
      }
    };
    
    testSupabaseConnection();
    // build local index in the background
    buildLocalIndex();

    // Periodically refresh local index (every 5 minutes)
    const interval = setInterval(() => {
      buildLocalIndex();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // On mount: remove `query` param from URL so refresh doesn't preserve search
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('query')) {
        url.searchParams.delete('query');
        window.history.replaceState({}, document.title, url.pathname + url.search);
        // Also clear local query state so input is empty on refresh
        setQuery('');
      }
    } catch (err) {
      // ignore
    }
  }, []);

  // 🟡 Highlight query matches - FIXED VERSION
  const highlightMatch = (text, query) => {
    if (!query || !text || query.length < 2) {
      return text;
    }
    
    try {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, "gi");
      const parts = text.split(regex);
      
      return parts.map((part, i) => {
        if (regex.test(part)) {
          return (
            <span key={i} style={{ color: "#f7b708ff", fontWeight: "bold" }}>
              {part}
            </span>
          );
        }
        return part;
      });
    } catch (error) {
      console.error("Error in highlightMatch:", error);
      return text;
    }
  };

  // ✋ Suggestion click handler
  const handleSuggestionClick = (value) => {
    console.log("👉 Suggestion clicked:", value);
    setQuery(value);
    fetchIdRef.current++;
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setSuggestions([]);
    setDropdownContent('none');
    setShowDropdown(false);
    if (inputRef.current) inputRef.current.blur();
    handleSearch(value);
  };

  // ✋ Recent search click handler
  const handleRecentSearchClick = (item) => {
    console.log("👉 Recent search clicked:", item);
    setQuery(item);
    // cancel pending fetches and timeouts
    fetchIdRef.current++;
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    setSuggestions([]);
    setDropdownContent('none');
    setShowDropdown(false);
    if (inputRef.current) inputRef.current.blur();
    handleSearch(item);
  };

  // 🎯 Focus handling
  const handleInputFocus = () => {
    console.log("🎯 Input focused, query:", query);
    // If local index is empty, try to build it now (helps when index failed on mount)
    if ((!localIndexRef.current.names.length && !localIndexRef.current.locations.length)) {
      buildLocalIndex();
    }

    if (recentSearches.length > 0 && query.length === 0) {
      setDropdownContent('recent');
      setShowDropdown(true);
    }
  };

  // 🎯 Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        console.log("👆 Clicked outside, hiding dropdown");
        // cancel any pending fetches/timeouts and clear UI
        fetchIdRef.current++;
        if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
        setShowDropdown(false);
        setSuggestions([]);
        setDropdownContent('none');
      }
    };

    // Use 'click' to avoid racing with suggestion onMouseDown handlers
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Render dropdown content - FIXED VERSION
 const renderDropdownContent = () => {
  console.log("🎨 Rendering dropdown content:", {
    loading,
    dropdownContent,
    suggestionsCount: suggestions.length,
    recentSearchesCount: recentSearches.length
  });

  if (loading) {
    return (
      <li className={styles.suggestionItem} key="loading">
        <div className="d-flex align-items-center justify-content-center py-2">
          <div className="spinner-border spinner-border-sm me-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="text-muted">Loading suggestions...</span>
        </div>
      </li>
    );
  }

  // ✅ Show recent searches
  if (dropdownContent === 'recent' && recentSearches.length > 0) {
    return (
      <>
        <li className={styles.suggestionHeader} key="recent-header">
          <i className="fa-solid fa-clock me-2"></i>
          Recently Searched
        </li>
        {recentSearches.map((item, index) => (
          <li
            key={`recent-${index}-${item}`}
            className={styles.suggestionItem}
            onMouseDown={() => handleRecentSearchClick(item)}
          >
            <i className="fa-solid fa-clock me-2 text-muted"></i>
            <span>{highlightMatch(item, query)}</span>
          </li>
        ))}
      </>
    );
  }

  // ✅ Always show suggestions if any are available
  if (suggestions.length > 0) {
    return (
      <>
        <li className={styles.suggestionHeader} key="suggestions-header">
          <i className="fa-solid fa-lightbulb me-2"></i>
          Suggestions
        </li>
    {suggestions.map((item, index) => (
          <li
            key={`suggestion-${index}-${item.value}`}
            className={styles.suggestionItem}
            onMouseDown={() => handleSuggestionClick(item.value)}
          >
            <i className={`fa-solid ${getSuggestionIcon(item.type)} me-2 text-muted`}></i>
            <span>{highlightMatch(item.display || item.value, query)}</span>
            <small className="text-muted ms-2">({item.type})</small>
          </li>
        ))}
      </>
    );
  }

  // ✅ No suggestions found case
  if (query.length >= 2 && !loading && suggestions.length === 0) {
    return (
      <li className={styles.suggestionItem} key="no-results">
        <div className="text-muted py-2 text-center">
          <i className="fa-solid fa-search me-2"></i>
          No suggestions found for "{query}"
        </div>
      </li>
    );
  }

  return null;
};


  return (
  <div className={styles.searchContainer}>
    {/* Search Box */}
    <div className={styles.searchBox}>
      <div className={styles.searchInputContainer}>
        <input
          ref={inputRef}
          type="text"
          className={styles.searchInput}
          placeholder="Search by Shop Name or Location"
          value={query}
          onChange={(e) => {
            console.log("⌨️ Input changed:", e.target.value);
            setQuery(e.target.value);
          }}
          onKeyDown={handleKeyPress}
          onFocus={handleInputFocus}
        />
        <button 
          className={styles.searchButton} 
          onClick={() => handleSearch()}
          disabled={!query.trim()}
        >
          <i className="fa-solid fa-magnifying-glass"></i>
        </button>
      </div>
    </div> 

    {/* Dropdown Suggestions */}
    {(showDropdown || suggestions.length > 0) && (
      <div className={styles.suggestionBox} ref={dropdownRef}>
        <ul className={styles.suggestionList}>
          {renderDropdownContent()}
        </ul>
      </div>
    )}
  </div>
);
}

// Helper function to get icons for different suggestion types
function getSuggestionIcon(type) {
  switch (type) {
    case 'shop':
      return 'fa-store';
    case 'city':
      return 'fa-city';
    case 'speciality':
      return 'fa-star';
    case 'location':
      return 'fa-map-marker-alt';
    default:
      return 'fa-search';
  }
}

export default Search;