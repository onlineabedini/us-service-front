// Section: Admin Locale Editor Page with Translation Support
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getCookie } from '../../../utils/authCookieService';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../config/api';
import { FaDownload, FaTrash, FaUndo, FaSearch, FaLanguage } from 'react-icons/fa';
import debounce from 'lodash/debounce';
import { adminService } from '../../../services/admin.service';

interface ProviderData {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
}

// Section: Helper to get available languages
const getLanguages = async (): Promise<string[]> => {
    return await adminService.getAvailableLanguages();
};

// Section: Helper to fetch translation JSON for a language
const fetchLocale = async (lang: string) => {
    return await adminService.fetchLocale(lang);
};

// Section: Helper to auto-save to localStorage
const autoSaveToLocal = (lang: string, data: object) => {
    localStorage.setItem(`locale-edit-${lang}`, JSON.stringify(data));
};

// Section: Helper to load auto-saved data from localStorage
const loadAutoSaved = (lang: string): object | null => {
    const saved = localStorage.getItem(`locale-edit-${lang}`);
    if (!saved) return null;
    try {
        return JSON.parse(saved);
    } catch {
        return null;
    }
};

// Section: Helper to trigger JSON file download
const downloadJson = (data: object, lang: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lang}-translation.json`;
    a.click();
    URL.revokeObjectURL(url);
};

// Section: Helper to get all string paths from an object
const getAllStringPaths = (obj: any, prefix = ''): [string, string][] => {
    const paths: [string, string][] = [];
    for (const key in obj) {
        const value = obj[key];
            const newPrefix = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') {
            paths.push([newPrefix, value]);
        } else if (typeof value === 'object' && value !== null) {
            paths.push(...getAllStringPaths(value, newPrefix));
        }
    }
    return paths;
};

// Section: Helper to set a value in a nested object by path
const setValueByPath = (obj: any, path: string, value: string): any => {
    const pathParts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let curr = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!(part in curr)) {
            curr[part] = isNaN(Number(pathParts[i + 1])) ? {} : [];
        }
        curr = curr[part];
    }
    curr[pathParts[pathParts.length - 1]] = value;
    return obj;
};

const AdminLocaleEditor: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [providerData, setProviderData] = useState<ProviderData | null>(null);
    const [languages, setLanguages] = useState<string[]>([]);
    const [selectedLang, setSelectedLang] = useState<string>('en');
    const [translations, setTranslations] = useState<Record<string, any>>({});
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [autoSaved, setAutoSaved] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');
    const [originalTranslations, setOriginalTranslations] = useState<Record<string, any>>({});
    const [showSaved, setShowSaved] = useState<boolean>(false);
    const [editBuffer, setEditBuffer] = useState<Record<string, Record<string, string>>>({});
    const [selectedLanguages, setSelectedLanguages] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [debouncedSearch, setDebouncedSearch] = useState<string>('');

    // Section: Memoized filtered paths
    const filteredResults = useMemo(() => {
        if (!debouncedSearch) return [];
        
        const searchLower = debouncedSearch.toLowerCase();
        const results: Array<{
            path: string;
            values: Record<string, string>;
            originalValues: Record<string, string>;
            foundInLang?: string;
        }> = [];
        
        // Get all unique paths from all languages
        const allPaths = new Set<string>();
        Object.values(translations).forEach(langData => {
            getAllStringPaths(langData).forEach(([path]) => allPaths.add(path));
        });
        
        // For each path, collect values from all languages
        allPaths.forEach(path => {
            const values: Record<string, string> = {};
            const originalValues: Record<string, string> = {};
            let hasMatch = false;
            let foundInLang: string | undefined;
            
            languages.forEach(lang => {
                const getValueByPath = (obj: any, path: string): string => {
                    const pathParts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
                    let curr = obj;
                    for (let part of pathParts) {
                        if (curr == null) return '';
                        curr = curr[part];
                    }
                    return typeof curr === 'string' ? curr : '';
                };
                
                const value = getValueByPath(translations[lang], path);
                const originalValue = getValueByPath(originalTranslations[lang], path);
                
                values[lang] = value;
                originalValues[lang] = originalValue;
                
                if (path.toLowerCase().includes(searchLower) || 
                    value.toLowerCase().includes(searchLower) ||
                    originalValue.toLowerCase().includes(searchLower)) {
                    hasMatch = true;
                    // Set foundInLang to the first language where the match was found
                    if (!foundInLang) {
                        foundInLang = lang;
                    }
                }
            });
            
            if (hasMatch) {
                results.push({ path, values, originalValues, foundInLang });
            }
        });
        
        return results;
    }, [debouncedSearch, translations, originalTranslations, languages]);

    // Section: Update selected language when search results change
    useEffect(() => {
        if (filteredResults.length > 0) {
            const newSelectedLanguages: Record<string, string> = {};
            filteredResults.forEach(result => {
                if (result.foundInLang) {
                    newSelectedLanguages[result.path] = result.foundInLang;
                }
            });
            setSelectedLanguages(prev => ({
                ...prev,
                ...newSelectedLanguages
            }));
        }
    }, [filteredResults]);

    // Section: Optimized search handler
    const debouncedSearchHandler = useCallback(
        debounce((value: string) => {
            setDebouncedSearch(value);
        }, 300), // Reduced debounce time from 500ms to 300ms
        []
    );

    // Section: Handle search input change
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        debouncedSearchHandler(e.target.value);
    }, [debouncedSearchHandler]);

    // Section: Load translations for all languages
    useEffect(() => {
        if (!languages.length) return;
        
        const loadAllTranslations = async () => {
            setIsLoading(true);
            setStatus('Loading translations...');
            setError('');
            
            const allTranslations: Record<string, any> = {};
            const allOriginalTranslations: Record<string, any> = {};
            
            for (const lang of languages) {
                try {
                    const saved = loadAutoSaved(lang);
                    if (saved) {
                        allTranslations[lang] = saved;
                        allOriginalTranslations[lang] = saved;
                    } else {
                        const data = await fetchLocale(lang);
                        allTranslations[lang] = data;
                        allOriginalTranslations[lang] = data;
                        autoSaveToLocal(lang, data);
                    }
                } catch (err) {
                    console.error(`Failed to load translations for ${lang}:`, err);
                }
            }
            
            setTranslations(allTranslations);
            setOriginalTranslations(allOriginalTranslations);
            setStatus('');
            setIsLoading(false);
        };
        
        loadAllTranslations();
    }, [languages]);

    // Section: Check provider pilot status
    useEffect(() => {
        const checkProviderStatus = async () => {
            const token = getCookie('token');
            const providerId = getCookie('providerId');

            if (!token || !providerId) {
                navigate('/login/provider');
                return;
            }

            try {
                const hasPermission = await adminService.checkAdminPermissions(providerId);
                if (!hasPermission) {
                    navigate('/');
                    return;
                }

                const data = await adminService.getProviderById(providerId);
                setProviderData(data);
            } catch (err) {
                console.error('Error checking provider status:', err);
                navigate('/login/provider');
            }
        };

        checkProviderStatus();
    }, [navigate]);

    // Section: Set default language on mount
    useEffect(() => {
        getLanguages().then(langs => {
            setLanguages(langs);
            setSelectedLang('en');
        });
    }, []);

    // Section: Show save indicator briefly on auto-save
    useEffect(() => {
        if (autoSaved) {
            setShowSaved(true);
            const timer = setTimeout(() => setShowSaved(false), 1200);
            return () => clearTimeout(timer);
        }
    }, [autoSaved]);

    // Section: Handle value changes
    const handleValueChange = (lang: string, path: string, value: string) => {
        setEditBuffer(prev => ({
            ...prev,
            [lang]: { ...prev[lang], [path]: value }
        }));
        
        const newTranslations = setValueByPath({ ...translations[lang] }, path, value);
        setTranslations(prev => ({
            ...prev,
            [lang]: newTranslations
        }));
        
        autoSaveToLocal(lang, newTranslations);
        setAutoSaved(true);
    };

    // Section: Helper to get changed translations
    const getChangedTranslations = () => {
        const changedTranslations: Record<string, Record<string, string>> = {};
        
        Object.entries(translations).forEach(([lang, langData]) => {
            const originalLangData = originalTranslations[lang];
            const changedData: Record<string, string> = {};
            let hasChanges = false;
            
            getAllStringPaths(langData).forEach(([path, value]) => {
                const originalValue = (() => {
                    const pathParts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
                    let curr = originalLangData;
                    for (let part of pathParts) {
                        if (curr == null) return '';
                        curr = curr[part];
                    }
                    return typeof curr === 'string' ? curr : '';
                })();
                
                // Skip if the value is "Select..." or empty or if the path is "Select..."
                if (value === 'Select...' || value === '' || path === 'Select...') {
                    return;
                }
                
                // Only include if the value is different from original and not empty
                if (value !== originalValue && value !== '' && value !== 'Select...') {
                    changedData[path] = value;
                    hasChanges = true;
                }
            });
            
            if (hasChanges) {
                changedTranslations[lang] = changedData;
            }
        });
        
        return changedTranslations;
    };

    // Section: Handle download
    const handleDownload = () => {
        const changedTranslations = getChangedTranslations();
        if (Object.keys(changedTranslations).length === 0) {
            alert('No changes to export!');
            return;
        }
        downloadJson(changedTranslations, 'translation-changes');
    };

    // Section: Handle clear all
    const handleClearAll = () => {
        if (window.confirm('Are you sure you want to clear all values?')) {
            const newTranslations = { ...translations };
            Object.keys(newTranslations).forEach(lang => {
            const cleared = {};
                getAllStringPaths(newTranslations[lang]).forEach(([path]) => setValueByPath(cleared, path, ''));
                newTranslations[lang] = cleared;
                autoSaveToLocal(lang, cleared);
            });
            setTranslations(newTranslations);
            setStatus('All values cleared!');
        }
    };

    // Section: Handle reset
    const handleReset = () => {
        if (window.confirm('Reset to original values and clear all saved changes?')) {
            const loadOriginalTranslations = async () => {
                const newTranslations = { ...translations };
                for (const lang of languages) {
                    try {
                        const data = await fetchLocale(lang);
                        newTranslations[lang] = data;
                        autoSaveToLocal(lang, data);
                        localStorage.removeItem(`locale-edit-${lang}`);
                    } catch (err) {
                        console.error(`Failed to reset translations for ${lang}:`, err);
                    }
                }
                setTranslations(newTranslations);
                setEditBuffer({});
                setStatus('Reset to original!');
                setError('');
            };
            loadOriginalTranslations();
        }
    };

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => navigate('/admin/settings')}
                            style={{
                                padding: '8px 16px',
                                background: '#6c757d',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '14px'
                            }}
                        >
                            ← Back to Settings
                        </button>
                        <div>
                            <h2 style={{ fontSize: 22, margin: 0 }}>Admin Panel - Translations</h2>
                            {providerData && (
                                <p style={{ margin: '5px 0 0', color: '#666' }}>
                                    Welcome, {providerData.firstName} {providerData.lastName}
                                </p>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={handleDownload}
                            style={{
                                padding: '8px 16px',
                                background: '#14b8a6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <FaDownload /> Export Changes
                        </button>
                        <button
                            onClick={handleClearAll}
                            style={{
                                padding: '8px 16px',
                                background: '#dc3545',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <FaTrash /> Clear All
                        </button>
                        <button
                            onClick={handleReset}
                            style={{
                                padding: '8px 16px',
                                background: '#6c757d',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <FaUndo /> Reset
                        </button>
                    </div>
                </div>

                {/* Section: Information Message */}
                <div style={{ 
                    background: '#e6fffd', 
                    padding: '15px 20px', 
                    borderRadius: 8, 
                    marginBottom: 20,
                    border: '1px solid #14b8a6'
                }}>
                    <h3 style={{ 
                        margin: '0 0 10px 0', 
                        color: '#0d9488',
                        fontSize: 16,
                        fontWeight: 'bold'
                    }}>
                        Important Information
                    </h3>
                    <p style={{ 
                        margin: 0, 
                        color: '#0f766e',
                        fontSize: 14,
                        lineHeight: 1.5
                    }}>
                        As an admin, you can help improve our platform's translations. Here's how to use this tool:
                        <br /><br />
                        <strong>1. Search for Translations:</strong>
                        <br />• Use the search box above to find specific words or phrases
                        <br />• The tool will automatically show the language where the term was found
                        <br /><br />
                        <strong>2. Edit Translations:</strong>
                        <br />• You can <strong>copy and paste</strong> text directly from the website into the translation fields
                        <br />• Edit the text as needed to improve the translation
                        <br />• Changes are automatically saved as you type
                        <br /><br />
                        <strong>3. Export Changes:</strong>
                        <br />• Click the "Export Changes" button when you're done
                        <br />• Only your modified translations will be exported
                        <br /><br />
                        Your input will help make Vitago more accessible to users worldwide! Thank you for your contribution.
                    </p>
                </div>

                {showSaved && (
                    <div style={{ 
                        position: 'fixed', 
                        top: 24, 
                        right: 32, 
                        zIndex: 1000, 
                        background: '#e6ffe6', 
                        color: '#218838', 
                        padding: '8px 18px', 
                        borderRadius: 24, 
                        fontWeight: 'bold', 
                        boxShadow: '0 2px 8px #0001' 
                    }}>
                        <span style={{ fontSize: 18 }}>✔</span> Saved!
                    </div>
                )}

                <div style={{ marginBottom: 16, position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder={t('admin.editLocales.searchPlaceholder')}
                            value={search}
                            onChange={handleSearchChange}
                            style={{
                                width: '100%',
                                padding: '12px 40px 12px 12px',
                                border: '1px solid #ccc',
                                borderRadius: 4,
                                fontSize: 16
                            }}
                        />
                        <FaSearch style={{
                            position: 'absolute',
                            right: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#666'
                        }} />
                    </div>
                </div>

                {status && <div style={{ color: 'blue', marginBottom: 10 }}>{status}</div>}
                {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

                <div style={{ overflowX: 'auto' }}>
                    {isLoading ? (
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            padding: '40px',
                            flexDirection: 'column',
                            gap: '16px'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid #f3f3f3',
                                borderTop: '4px solid #1976d2',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <div style={{ color: '#666' }}>Loading translations...</div>
                        </div>
                    ) : filteredResults.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 15 }}>
                            <thead>
                                <tr>
                                    <th style={{ border: '1px solid #ccc', padding: 10, background: '#f8f9fa', width: '30%', textAlign: 'left' }}>Key</th>
                                    <th style={{ border: '1px solid #ccc', padding: 10, background: '#f8f9fa', textAlign: 'left' }}>Translations</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResults.map(({ path, values, originalValues }) => (
                                    <tr key={path}>
                                        <td style={{ border: '1px solid #ccc', padding: 10, background: '#fcfcfc' }}>
                                            {path}
                                        </td>
                                        <td style={{ border: '1px solid #ccc', padding: 10, background: '#fcfcfc' }}>
                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ position: 'relative' }}>
                                                    <select
                                                        value={selectedLanguages[path] || 'en'}
                                                        onChange={(e) => {
                                                            setSelectedLanguages(prev => ({
                                                                ...prev,
                                                                [path]: e.target.value
                                                            }));
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '8px 12px 8px 40px',
                                                            fontSize: 15,
                                                            border: '1px solid #ccc',
                                                            borderRadius: 4,
                                                            background: '#fff',
                                                            marginBottom: 12,
                                                            appearance: 'none'
                                                        }}
                                                    >
                                                        {languages.map(lang => {
                                                            const hasChanged = values[lang] !== originalValues[lang];
                                                            return (
                                                                <option 
                                                                    key={lang} 
                                                                    value={lang}
                                                                    style={{
                                                                        background: hasChanged ? '#fff3cd' : '#fff',
                                                                        color: hasChanged ? '#856404' : '#000'
                                                                    }}
                                                                >
                                                                    {lang.toUpperCase()} {hasChanged ? '(Modified)' : ''}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                    <FaLanguage style={{
                                                        position: 'absolute',
                                                        left: 12,
                                                        top: '50%',
                                                        transform: 'translateY(-50%)',
                                                        color: '#666'
                                                    }} />
                                                </div>
                                                {(() => {
                                                    const selectedLang = selectedLanguages[path] || 'en';
                                                    const value = values[selectedLang] || '';
                                                    const originalValue = originalValues[selectedLang] || '';
                                                    const bufferedValue = editBuffer[selectedLang]?.[path] !== undefined ? editBuffer[selectedLang][path] : value;
                                                    const hasChanged = value !== originalValue;
                                                    
                                                    return (
                                                        <>
                                                            <div style={{ 
                                                                color: '#888', 
                                                                fontStyle: 'italic', 
                                                                background: '#f4f4f4', 
                                                                padding: '4px 8px', 
                                                                borderRadius: 4, 
                                                                marginBottom: 6,
                                                                fontSize: 13
                                                            }}>
                                                                {originalValue || <span style={{ color: '#bbb' }}>(empty)</span>}
                                                            </div>
                                                            <textarea
                                                                value={bufferedValue}
                                                                onChange={e => handleValueChange(selectedLang, path, e.target.value)}
                                                                style={{
                                                                    width: '100%',
                                                                    fontSize: 15,
                                                                    padding: 8,
                                                                    border: '1px solid #bbb',
                                                                    borderRadius: 4,
                                                                    minHeight: '2.5em',
                                                                    resize: 'none',
                                                                    background: hasChanged ? '#fff3cd' : '#fff'
                                                                }}
                                                                rows={1}
                                                            />
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : debouncedSearch ? (
                        <div style={{ color: 'gray', marginTop: 24 }}>No matching keys or values found.</div>
                    ) : (
                        <div style={{ color: 'gray', marginTop: 24 }}>Enter a search term to find translations.</div>
                    )}
                </div>
            </div>
            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default AdminLocaleEditor; 