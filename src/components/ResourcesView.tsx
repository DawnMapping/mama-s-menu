import { useState, useRef } from 'react';
import { useBooks, getBookFileUrl } from '@/hooks/useBooks';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Upload, Download, Eye, Trash2, FileText, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';

export function ResourcesView() {
  const { data: books, isLoading } = useBooks();
  const [viewingBook, setViewingBook] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'epub'].includes(ext || '')) {
      toast({ title: 'Invalid file', description: 'Please upload a PDF or EPUB file', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const filePath = `${Date.now()}-${file.name}`;

      // Use XMLHttpRequest for upload progress tracking
      const { data: { publicUrl } } = supabase.storage.from('books').getPublicUrl('');
      const bucketUrl = publicUrl.replace(/\/object\/public\/books\/$/, '');
      
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/books/${filePath}`;
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 90));
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(90);
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        });
        
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`);
        xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.send(file);
      });

      setUploadProgress(95);

      // Derive a title from the filename
      const title = file.name.replace(/\.(pdf|epub)$/i, '').replace(/[-_]/g, ' ');

      const { error: dbError } = await supabase.from('books').insert({
        title,
        book_source: title,
        file_path: filePath,
        file_type: ext || 'pdf',
      });
      if (dbError) throw dbError;

      setUploadProgress(100);
      toast({ title: 'Book uploaded', description: `"${title}" is now available in Resources` });
      qc.invalidateQueries({ queryKey: ['books'] });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    await supabase.storage.from('books').remove([filePath]);
    await supabase.from('books').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['books'] });
    toast({ title: 'Book removed' });
  };

  // Inline PDF viewer
  if (viewingBook) {
    const book = books?.find(b => b.id === viewingBook);
    if (!book) return null;
    const url = getBookFileUrl(book.file_path);

    return (
      <div className="space-y-4">
        <button
          onClick={() => setViewingBook(null)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Resources
        </button>
        <h2 className="font-serif text-xl text-foreground">{book.title}</h2>
        {book.file_type === 'pdf' ? (
          <iframe
            src={`${url}#toolbar=1`}
            className="w-full rounded-lg border border-border"
            style={{ height: 'calc(100vh - 200px)' }}
            title={book.title}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>EPUB viewing is not supported inline.</p>
            <a
              href={url}
              download
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Download className="w-4 h-4" /> Download to read
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-foreground">Resources</h2>
        <label
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading...' : 'Upload Book'}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.epub"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {uploading && (
        <div className="space-y-1.5">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Uploading… {uploadProgress}%
          </p>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-center py-12">Loading resources...</p>
      ) : !books?.length ? (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">No books uploaded yet</p>
          <p className="text-xs text-muted-foreground">Upload your CSIRO PDFs or EPUBs to read them here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {books.map((book) => (
            <div
              key={book.id}
              className="rounded-lg border border-border/50 bg-card p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-base font-semibold text-foreground leading-tight">
                    {book.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 uppercase">
                    {book.file_type}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewingBook(book.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> Read
                </button>
                <a
                  href={getBookFileUrl(book.file_path)}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <button
                  onClick={() => handleDelete(book.id, book.file_path)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
