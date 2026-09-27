import React, { useState, useEffect } from 'react';
import {
  X,
  UploadCloud,
  FileAudio,
  FileText,
  BarChart3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Layers,
  Users,
  BookOpen,
  Headphones,
} from 'lucide-react';
import { api } from '../services/api';
import type { ToeicTest, AudioItemSummary, AdminStats } from '../types';

interface AdminCmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export const AdminCmsModal: React.FC<AdminCmsModalProps> = ({
  isOpen,
  onClose,
  onDataChanged,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [tests, setTests] = useState<ToeicTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<number | ''>('');
  const [part, setPart] = useState<3 | 4>(3);
  const [itemNumber, setItemNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcriptText, setTranscriptText] = useState<string>('');

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Manage tab state
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [items, setItems] = useState<AudioItemSummary[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const loadStats = React.useCallback(() => {
    api.admin.getStats()
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load stats:', err));
  }, []);

  // Load tests and initial stats
  useEffect(() => {
    if (!isOpen) return;

    api.toeic.getTests()
      .then((data) => {
        setTests(data);
        if (data.length > 0) {
          setSelectedTestId((prev) => (prev ? prev : data[0].id));
        }
      })
      .catch((err) => console.error('Failed to load tests:', err));

    loadStats();
  }, [isOpen, loadStats]);

  // Load items when selectedTestId changes in manage tab
  useEffect(() => {
    if (!isOpen || !selectedTestId) return;

    let isMounted = true;
    api.toeic.getTestItems(Number(selectedTestId))
      .then((data) => {
        if (isMounted) setItems(data);
      })
      .catch((err) => console.error('Failed to load test items:', err))
      .finally(() => {
        if (isMounted) setLoadingItems(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedTestId]);

  if (!isOpen) return null;

  const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.includes('audio') || file.name.endsWith('.mp3')) {
        setAudioFile(file);
      } else {
        setUploadError('Chỉ hỗ trợ file định dạng âm thanh (.mp3)');
      }
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!selectedTestId) {
      setUploadError('Vui lòng chọn Đề thi áp dụng.');
      return;
    }
    if (!itemNumber.trim()) {
      setUploadError('Vui lòng nhập Mã câu hỏi (vd: 35-37, 74-76).');
      return;
    }
    if (!title.trim()) {
      setUploadError('Vui lòng nhập Tiêu đề bài nghe.');
      return;
    }
    if (!audioFile) {
      setUploadError('Vui lòng chọn hoặc kéo thả file âm thanh MP3.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('testId', selectedTestId.toString());
      formData.append('part', part.toString());
      formData.append('itemNumber', itemNumber.trim());
      formData.append('title', title.trim());
      formData.append('audioFile', audioFile);
      formData.append('transcriptText', transcriptText.trim());

      const res = await api.admin.uploadItem(formData);
      setUploadSuccess(`Đã tạo thành công "${res.title}" với ${res.totalSegments} câu phân đoạn tự động!`);
      
      // Reset form
      setItemNumber('');
      setTitle('');
      setAudioFile(null);
      setTranscriptText('');

      loadStats();
      if (selectedTestId) {
        api.toeic.getTestItems(Number(selectedTestId)).then(setItems);
      }
      onDataChanged?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload thất bại';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài nghe này và toàn bộ phân đoạn liên quan?')) {
      return;
    }

    try {
      setDeleteLoadingId(itemId);
      await api.admin.deleteItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      loadStats();
      onDataChanged?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xóa thất bại';
      alert(msg);
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] glass-card rounded-2xl border border-slate-700/60 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Quản trị Đề thi & Nội dung (Admin CMS)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ROLE_ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400">Tải lên bài nghe MP3, bóc tách transcript tự động và quản trị kho đề</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-slate-900/30">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Tải lên đề mới (Upload)</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Quản lý & Thống kê (Manage & Stats)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'upload' && (
            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {uploadSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{uploadSuccess}</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Grid 1: Test Selection & Part */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Đề thi ETS áp dụng <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {tests.map((t) => (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                        {t.title} ({t.year})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Phần thi (Part) <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPart(3)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        part === 3
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Part 3 (Hội thoại)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPart(4)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                        part === 4
                          ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Part 4 (Bài nói ngắn)
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid 2: Item Number & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Số thứ tự câu (vd: 35-37, 74-76) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={itemNumber}
                    onChange={(e) => setItemNumber(e.target.value)}
                    placeholder="35-37"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Tiêu đề bài nghe <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Office Equipment Discussion"
                    className="w-full px-3.5 py-2 rounded-xl glass-input text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Audio File Drag & Drop Zone */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Tập tin âm thanh MP3 <span className="text-rose-400">*</span>
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleAudioDrop}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    audioFile
                      ? 'border-emerald-500/60 bg-emerald-500/5'
                      : 'border-slate-700 hover:border-slate-500 bg-slate-900/40'
                  }`}
                >
                  <input
                    type="file"
                    id="audio-upload-input"
                    accept="audio/mp3,audio/*"
                    onChange={handleAudioChange}
                    className="hidden"
                  />
                  <label htmlFor="audio-upload-input" className="cursor-pointer block">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      {audioFile ? <FileAudio className="w-6 h-6 text-emerald-400" /> : <UploadCloud className="w-6 h-6" />}
                    </div>
                    {audioFile ? (
                      <div>
                        <p className="text-xs font-semibold text-emerald-300">{audioFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(audioFile.size / 1024).toFixed(1)} KB - Nhấp để đổi file</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-slate-300">Kéo thả file MP3 vào đây, hoặc <span className="text-emerald-400 underline">chọn từ máy tính</span></p>
                        <p className="text-[10px] text-slate-500 mt-1">Định dạng khuyến nghị: .mp3 tiêu chuẩn ETS</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Transcript Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Nội dung Transcript (Tự động bóc tách câu & từ khóa)
                  </label>
                  <span className="text-[10px] text-slate-500">Mỗi dấu chấm câu sẽ tạo 1 phân đoạn</span>
                </div>
                <textarea
                  rows={4}
                  value={transcriptText}
                  onChange={(e) => setTranscriptText(e.target.value)}
                  placeholder="Dán toàn bộ lời thoại hội thoại hoặc bài nói tại đây. Hệ thống sẽ tự động bóc tách từng câu, nhận diện từ khóa và sinh dữ liệu chép chính tả..."
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang phân tách & Lưu trữ...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Tải lên & Khởi tạo Đề thi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'manage' && (
            <div className="space-y-6">
              {/* Statistics Cards */}
              {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="p-3.5 rounded-xl glass-card border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Đề thi</span>
                    </div>
                    <p className="text-xl font-bold text-slate-100">{stats.totalTests}</p>
                  </div>

                  <div className="p-3.5 rounded-xl glass-card border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bài nghe</span>
                    </div>
                    <p className="text-xl font-bold text-slate-100">{stats.totalAudioItems}</p>
                  </div>

                  <div className="p-3.5 rounded-xl glass-card border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Layers className="w-3.5 h-3.5 text-brand-400" />
                      <span>Câu đục lỗ</span>
                    </div>
                    <p className="text-xl font-bold text-slate-100">{stats.totalSegments}</p>
                  </div>

                  <div className="p-3.5 rounded-xl glass-card border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Học viên</span>
                    </div>
                    <p className="text-xl font-bold text-slate-100">{stats.totalUsers}</p>
                  </div>

                  <div className="p-3.5 rounded-xl glass-card border border-slate-800">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>Lượt học</span>
                    </div>
                    <p className="text-xl font-bold text-slate-100">{stats.totalStudySessions}</p>
                  </div>
                </div>
              )}

              {/* Items Management Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Danh sách bài nghe trong đề đang chọn
                  </h3>
                  <select
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(Number(e.target.value))}
                    className="px-3 py-1.5 rounded-lg glass-input text-xs text-slate-200"
                  >
                    {tests.map((t) => (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                {loadingItems ? (
                  <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Đang tải dữ liệu...</span>
                  </div>
                ) : items.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    Chưa có bài nghe nào trong đề thi này. Hãy chuyển sang tab Tải lên để thêm đề mới.
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Mã câu</th>
                          <th className="py-2.5 px-3 font-semibold">Phần thi</th>
                          <th className="py-2.5 px-3 font-semibold">Tiêu đề</th>
                          <th className="py-2.5 px-3 font-semibold text-center">Số câu</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{item.itemNumber}</td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                item.part === 3 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                Part {item.part}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300 font-medium">{item.title}</td>
                            <td className="py-2.5 px-3 text-center text-slate-400">{item.totalSegments} segments</td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                disabled={deleteLoadingId === item.id}
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                                title="Xóa bài nghe"
                              >
                                {deleteLoadingId === item.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
