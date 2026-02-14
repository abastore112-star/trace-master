import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { s3Service } from '../services/s3Service';
import { ArrowLeft, Upload, X, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AdminPanelProps {
    onBack: () => void;
    userId: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack, userId }) => {
    const [category, setCategory] = useState('anime');
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    // Existing items for management
    const [galleryItems, setGalleryItems] = useState<any[]>([]);
    const [isLoadingItems, setIsLoadingItems] = useState(true);

    useEffect(() => {
        fetchGalleryItems();
        return () => {
            // Cleanup previews
            previews.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    const fetchGalleryItems = async () => {
        setIsLoadingItems(true);
        try {
            const { data, error } = await supabase
                .from('gallery_sketches')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setGalleryItems(data);
        } catch (error) {
            console.error('Fetch failed:', error);
        } finally {
            setIsLoadingItems(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles: File[] = Array.from(e.target.files);
            setFiles(prev => [...prev, ...selectedFiles]);

            const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
            setPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(previews[index]);
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setStatus({ type: 'error', message: 'Please select at least one file.' });
            return;
        }

        setIsUploading(true);
        setStatus({ type: null, message: '' });
        setUploadProgress({ current: 0, total: files.length });

        let successCount = 0;
        let failCount = 0;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    // 1. Upload to Supabase Storage (Bucket: 'gallery')
                    const timestamp = Date.now();
                    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');

                    // Folder structure: category/filename
                    const filePath = `${category}/${timestamp}_${i}_${cleanFileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('gallery')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    // 2. Generate Auto-Title
                    const autoTitle = `${timestamp}${i}`;

                    // 3. Insert into Supabase DB
                    // storage_path should be consistent with Gallery.tsx expectation (which appends it to public URL)
                    // Gallery.tsx uses: ${storageUrl}/${item.storage_path} -> .../public/gallery/path 
                    // So we must store 'gallery/path' OR update Gallery.tsx
                    // Let's store 'gallery/path' to match legacy behavior if it exists, OR check Gallery.tsx logic.
                    // Gallery.tsx: url: `${storageUrl}/${item.storage_path}`
                    // If storageUrl is .../public, and we upload to 'gallery' bucket, the public URL is .../public/gallery/filename.
                    // So we need to store 'gallery/category/filename'.

                    const dbStoragePath = `gallery/${filePath}`;

                    const { error: dbError } = await supabase.from('gallery_sketches').insert({
                        title: autoTitle,
                        category,
                        storage_path: dbStoragePath,
                        is_active: true
                    });

                    if (dbError) throw dbError;
                    successCount++;
                    setUploadProgress(prev => ({ ...prev, current: successCount }));

                } catch (error) {
                    console.error(`Failed to upload ${file.name}:`, error);
                    failCount++;
                }
            }

            if (failCount > 0) {
                setStatus({ type: 'error', message: `Uploaded ${successCount} files. ${failCount} failed.` });
            } else {
                setStatus({ type: 'success', message: `Successfully uploaded all ${successCount} files!` });
                setFiles([]);
                setPreviews([]);
            }

            fetchGalleryItems(); // Refresh list

        } catch (error: any) {
            console.error('Batch upload critical failure:', error);
            setStatus({ type: 'error', message: `Critical error: ${error.message || 'Unknown error'}` });
        } finally {
            setIsUploading(false);
            setUploadProgress({ current: 0, total: 0 });
        }
    };

    const handleDelete = async (id: string, storagePath: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            const { error } = await supabase.from('gallery_sketches').delete().eq('id', id);
            if (error) throw error;
            fetchGalleryItems();
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete item.');
        }
    };

    return (
        <div className="min-h-screen bg-cream flex flex-col animate-in fade-in duration-500">
            {/* Header */}
            <header className="px-8 py-6 flex items-center justify-between bg-white/50 backdrop-blur-md border-b border-sienna/10 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-3 rounded-full hover:bg-sienna/5 text-sienna/60 hover:text-sienna transition-all"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-light italic text-sienna">Gallery Admin</h1>
                </div>
            </header>

            <div className="flex-1 p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 pb-20">

                {/* Left Column: Upload Section */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white/60 p-8 rounded-[2.5rem] border border-sienna/10 shadow-sm flex-shrink-0">
                        <div className="flex items-center gap-3 mb-6">
                            <Upload className="w-5 h-5 text-accent" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-sienna/60">Batch Upload</h2>
                        </div>

                        <div className="space-y-6">
                            <label className="block space-y-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-sienna/60 pl-2">Category</span>
                                <div className="relative">
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-6 py-4 rounded-2xl bg-white border border-sienna/10 focus:outline-none focus:border-accent font-medium text-sienna appearance-none cursor-pointer hover:bg-sienna/5 transition-colors"
                                    >
                                        <option value="anime">Anime & Manga</option>
                                        <option value="cartoon">Cartoons & Kids</option>
                                        <option value="nature">Nature & Animals</option>
                                        <option value="general">General Objects</option>
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-sienna/40">
                                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                </div>
                            </label>

                            <div className="pt-2">
                                <div className="border-2 border-dashed border-sienna/20 rounded-[2rem] h-32 flex flex-col items-center justify-center gap-2 text-center cursor-pointer hover:bg-white transition-all relative overflow-hidden group">
                                    <input
                                        type="file"
                                        accept="image/png, image/svg+xml, image/jpeg"
                                        multiple
                                        onChange={handleFileChange}
                                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="w-10 h-10 bg-accent/10 text-accent rounded-full flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-sienna/40 group-hover:text-sienna/60">
                                        Add Files
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Staged Files List - Max height but scrolls internally too */}
                    <div className="bg-white/40 rounded-[2.5rem] border border-sienna/5 overflow-hidden flex flex-col relative max-h-[600px]">
                        <div className="p-6 border-b border-sienna/5 flex justify-between items-center bg-white/20 backdrop-blur-md sticky top-0 z-10">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-sienna/60">Staged Files ({files.length})</span>
                            {files.length > 0 && (
                                <button onClick={() => { setFiles([]); setPreviews([]); }} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600">Clear All</button>
                            )}
                        </div>

                        <div className="overflow-y-auto p-6 space-y-3 custom-scrollbar flex-1 min-h-[200px]">
                            {files.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 py-12">
                                    <p className="text-[10px] uppercase tracking-widest font-bold">No files selected</p>
                                </div>
                            ) : (
                                files.map((file, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 bg-white rounded-2xl border border-sienna/5 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                        <div className="w-12 h-12 bg-sienna/5 rounded-xl overflow-hidden flex-shrink-0">
                                            <img src={previews[idx]} className="w-full h-full object-cover" alt="preview" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-sienna truncate">{file.name}</p>
                                            <p className="text-[9px] text-sienna/40 uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="p-2 text-sienna/20 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Action Footer */}
                        <div className="p-6 bg-white/60 border-t border-sienna/5 backdrop-blur-md">
                            {status.message && (
                                <div className={`mb-4 p-3 rounded-xl flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                    {status.message}
                                </div>
                            )}

                            <button
                                onClick={handleUpload}
                                disabled={isUploading || files.length === 0}
                                className="w-full py-5 bg-sienna text-cream rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl shadow-sienna/10 hover:shadow-accent/20 hover:-translate-y-1 relative overflow-hidden"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                                        <span className="relative z-10">Uploading {uploadProgress.current}/{uploadProgress.total}...</span>
                                        <div
                                            className="absolute inset-0 bg-accent/20 z-0 transition-all duration-300"
                                            style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                                        />
                                    </>
                                ) : (
                                    'Upload All Files'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: List Section */}
                <div className="bg-white/40 p-8 rounded-[2.5rem] border border-sienna/5 h-fit max-h-[1200px] flex flex-col relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/0 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-sienna/40">Current Gallery</h2>
                            <button onClick={fetchGalleryItems} className="p-1.5 rounded-full hover:bg-sienna/5 text-sienna/40 hover:text-sienna transition-all" title="Refresh">
                                <Loader2 className={`w-3 h-3 ${isLoadingItems ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        <span className="text-[10px] font-bold bg-sienna/5 px-3 py-1 rounded-full text-sienna/60">{galleryItems.length} Items</span>
                    </div>

                    <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 -mr-2 flex-1 pb-20 min-h-[400px]">
                        {isLoadingItems && galleryItems.length === 0 ? (
                            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-sienna/20" /></div>
                        ) : galleryItems.length === 0 ? (
                            <div className="text-center py-12 opacity-40">
                                <Trash2 className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-xs uppercase tracking-widest">Gallery Empty</p>
                            </div>
                        ) : (
                            galleryItems.map((item) => (
                                <div key={item.id} className="group flex items-center gap-4 p-3 bg-white rounded-2xl border border-sienna/5 hover:border-accent/20 transition-colors shadow-sm">
                                    <div className="w-12 h-12 bg-sienna/5 rounded-xl overflow-hidden flex-shrink-0 border border-sienna/5 relative">
                                        <img
                                            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${item.storage_path}?width=100&height=100&resize=cover`}
                                            className="w-full h-full object-cover"
                                            alt={item.title}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-sienna truncate group-hover:text-accent transition-colors">{item.title}</h4>
                                        <p className="text-[9px] text-sienna/40 uppercase tracking-widest">{item.category}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id, item.storage_path)}
                                        className="p-2 text-sienna/20 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                        title="Delete Item"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminPanel;
