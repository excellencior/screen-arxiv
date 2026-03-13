import React, { useState, useRef } from 'react';
import { Container, Button, Card, Form, Spinner } from 'react-bootstrap';
import { Download, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import * as fflate from 'fflate';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import toast from 'react-hot-toast';

export default function SaveData() {
  const { movies, shows, importData } = useLibrary();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = JSON.stringify({ movies, shows }, null, 2);
      const dataUint8Array = new TextEncoder().encode(data);
      
      const zipped = await new Promise<Uint8Array>((resolve, reject) => {
        fflate.zip({
          'library_backup.json': dataUint8Array
        }, (err, dat) => {
          if (err) reject(err);
          else resolve(dat);
        });
      });

      const fileName = `screen_arxiv_backup_${new Date().toISOString().split('T')[0]}.zip`;

      if (Capacitor.isNativePlatform()) {
        // Handle Mobile Export
        const base64Data = btoa(
          new Uint8Array(zipped).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });

        await Share.share({
          title: 'Export Screen Arxiv Library',
          text: 'Here is your library backup.',
          url: savedFile.uri,
          dialogTitle: 'Save Backup'
        });
      } else {
        // Handle Web Export
        const blob = new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.success('Backup exported successfully!', { icon: <CheckCircle2 size={16} className="text-success" /> });
    } catch (e) {
      console.error(e);
      toast.error('Failed to export backup', { icon: <AlertCircle size={16} className="text-danger" /> });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        const unzipped = await new Promise<fflate.Unzipped>((resolve, reject) => {
          fflate.unzip(uint8Array, (err, dat) => {
            if (err) reject(err);
            else resolve(dat);
          });
        });

        const backupFile = unzipped['library_backup.json'];
        if (!backupFile) {
          throw new Error('Invalid backup file: library_backup.json not found inside ZIP.');
        }

        const jsonString = new TextDecoder().decode(backupFile);
        const parsedData = JSON.parse(jsonString);

        if (!Array.isArray(parsedData.movies) || !Array.isArray(parsedData.shows)) {
          throw new Error('Invalid backup file format: Missing movies or shows array.');
        }

        importData(parsedData.movies, parsedData.shows);
        toast.success(`Restored ${parsedData.movies.length} movies and ${parsedData.shows.length} shows!`, { icon: <CheckCircle2 size={16} className="text-success" /> });
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || 'Failed to import backup.', { icon: <AlertCircle size={16} className="text-danger" /> });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read the selected file.', { icon: <AlertCircle size={16} className="text-danger" /> });
      setIsImporting(false);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <Container className="py-4 px-4" style={{ maxWidth: '672px' }}>
      <div className="mb-4 d-flex flex-column flex-sm-row align-items-start align-items-sm-baseline gap-1 gap-sm-2">
        <h1 className="fs-5 fw-bold font-mono text-body m-0">Save Data</h1>
        <p className="text-secondary font-mono m-0" style={{ fontSize: '12px' }}>Backup or restore library.</p>
      </div>

      <div className="row g-3">
        {/* Export Card */}
        <div className="col-12 col-md-6">
          <Card className="border-0 shadow-sm rounded-4 bg-body h-100 p-3 text-center d-flex flex-column justify-content-between">
            <div>
              <div className="mb-2 d-flex justify-content-center">
                <div className="d-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 text-primary" style={{ width: '40px', height: '40px' }}>
                  <Download size={20} />
                </div>
              </div>
              <h5 className="fw-bold font-mono text-body mb-2" style={{ fontSize: '15px' }}>Export Backup</h5>
              <p className="text-secondary font-mono mx-auto mb-3" style={{ fontSize: '12px' }}>
                Download a `.zip` file of your library.
              </p>
            </div>
            <div>
              <Button
                variant="primary"
                className="w-100 d-inline-flex align-items-center justify-content-center gap-2 font-mono py-2 rounded border-0"
                style={{ fontSize: '13px' }}
                onClick={handleExport}
                disabled={isExporting || (movies.length === 0 && shows.length === 0)}
              >
                {isExporting ? <Spinner size="sm" /> : <Download size={14} />}
                <span>{isExporting ? 'Exporting...' : 'Export'}</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Import Card */}
        <div className="col-12 col-md-6">
          <Card className="border-0 shadow-sm rounded-4 bg-body h-100 p-3 text-center d-flex flex-column justify-content-between">
            <div>
              <div className="mb-2 d-flex justify-content-center">
                <div className="d-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 text-success" style={{ width: '40px', height: '40px' }}>
                  <Upload size={20} />
                </div>
              </div>
              <h5 className="fw-bold font-mono text-body mb-2" style={{ fontSize: '15px' }}>Restore Backup</h5>
              <p className="text-secondary font-mono mx-auto mb-3" style={{ fontSize: '12px' }}>
                Upload a `.zip` to restore data.
              </p>
            </div>
            <div>
              <Button
                variant="outline-secondary"
                className="w-100 d-inline-flex align-items-center justify-content-center gap-2 font-mono py-2 rounded border-0 bg-secondary bg-opacity-10 text-body"
                style={{ fontSize: '13px' }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? <Spinner size="sm" /> : <Upload size={14} />}
                <span>{isImporting ? 'Restoring...' : 'Restore'}</span>
              </Button>
              <Form.Control
                type="file"
                accept=".zip"
                className="d-none"
                ref={fileInputRef}
                onChange={handleImport}
              />
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}
