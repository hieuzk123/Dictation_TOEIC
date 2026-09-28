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
  Plus,
  FolderPlus,
  HelpCircle,
  Sparkles,
  ListPlus,
  ClipboardPaste,
} from 'lucide-react';
import { api } from '../services/api';
import type { ToeicTest, AudioItemSummary, AdminStats, CreateQuestionRequest } from '../types';
import { parseQuickPasteQuestions } from '../utils/questionParser';

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

  // Questions state for ETS Multiple Choice (Hard mode)
  const [questionsMode, setQuestionsMode] = useState<'cards' | 'quick-paste'>('cards');
  const [quickPasteText, setQuickPasteText] = useState<string>('');
  const [questions, setQuestions] = useState<CreateQuestionRequest[]>([
    { questionNumber: 32, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', explanation: '' },
    { questionNumber: 33, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', explanation: '' },
    { questionNumber: 34, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', explanation: '' },
  ]);

  // New test creation state
  const [isCreatingNewTest, setIsCreatingNewTest] = useState<boolean>(false);
  const [newTestYear, setNewTestYear] = useState<string>('2023');
  const [newTestNumber, setNewTestNumber] = useState<number>(1);
  const [newTestTitle, setNewTestTitle] = useState<string>('');
  const [isSavingTest, setIsSavingTest] = useState<boolean>(false);

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

  const handleSaveNewTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTestYear.trim()) {
      setUploadError('Vui lòng nhập Năm phát hành hoặc Bộ đề (vd: 2023 hoặc ETS 2023).');
      return;
    }
    if (!newTestNumber || newTestNumber < 1) {
      setUploadError('Vui lòng nhập Số thứ tự đề hợp lệ (lớn hơn 0).');
      return;
    }

    try {
      setIsSavingTest(true);
      setUploadError(null);
      const computedTitle =
        newTestTitle.trim() ||
        `${newTestYear.trim().toUpperCase().startsWith('ETS') ? newTestYear.trim() : 'ETS ' + newTestYear.trim()} - Test ${newTestNumber}`;
      const created = await api.admin.createTest({
        year: newTestYear.trim(),
        testNumber: Number(newTestNumber),
        title: computedTitle,
      });

      const updatedTests = await api.toeic.getTests();
      setTests(updatedTests);
      setSelectedTestId(created.id);
      setIsCreatingNewTest(false);
      setUploadSuccess(`Đã tạo thành công đề thi "${created.title}"!`);
      onDataChanged?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tạo đề thi mới thất bại';
      setUploadError(msg);
    } finally {
      setIsSavingTest(false);
    }
  };

  const handleAudioDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.includes('audio') || file.name.endsWith('.mp3')) {
        if (file.size > 50 * 1024 * 1024) {
          setUploadError(`Tập tin âm thanh quá lớn (${(file.size / (1024 * 1024)).toFixed(1)}MB). Giới hạn tối đa là 50MB.`);
          return;
        }
        setUploadError(null);
        setAudioFile(file);
      } else {
        setUploadError('Chỉ hỗ trợ file định dạng âm thanh (.mp3)');
      }
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 50 * 1024 * 1024) {
        setUploadError(`Tập tin âm thanh quá lớn (${(file.size / (1024 * 1024)).toFixed(1)}MB). Giới hạn tối đa là 50MB.`);
        return;
      }
      setUploadError(null);
      setAudioFile(file);
    }
  };

  const handleItemNumberChange = (val: string) => {
    setItemNumber(val);
    const match = val.match(/^(\d+)/);
    if (match) {
      const startNum = parseInt(match[1], 10);
      setQuestions((prev) =>
        prev.map((q, idx) => ({
          ...q,
          questionNumber: startNum + idx,
        }))
      );
    }
  };

  const updateQuestionField = <K extends keyof CreateQuestionRequest>(
    index: number,
    field: K,
    value: CreateQuestionRequest[K]
  ) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === index ? { ...q, [field]: value } : q))
    );
  };

  const handleParseQuickPaste = () => {
    const parsed = parseQuickPasteQuestions(quickPasteText);
    if (parsed.length === 0) {
      setUploadError('Không tìm thấy câu hỏi hợp lệ trong văn bản dán nhanh. Vui lòng kiểm tra lại cấu trúc.');
      return;
    }
    setQuestions(parsed);
    setQuestionsMode('cards');
    setUploadError(null);
    setUploadSuccess(`Đã bóc tách tự động thành công ${parsed.length} câu hỏi!`);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    setUploadSuccess(null);

    if (!isCreatingNewTest && !selectedTestId) {
      setUploadError('Vui lòng chọn hoặc tạo Đề thi áp dụng.');
      return;
    }
    if (isCreatingNewTest && (!newTestYear.trim() || !newTestNumber)) {
      setUploadError('Vui lòng nhập đầy đủ Năm và Số thứ tự đề thi mới.');
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

    // Validate questions if any question text is filled
    const validQuestions = questions.filter((q) => q.questionText.trim().length > 0);
    if (validQuestions.length > 0) {
      for (const q of validQuestions) {
        if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
          setUploadError(`Vui lòng điền đủ 4 đáp án A, B, C, D cho câu hỏi số ${q.questionNumber}.`);
          return;
        }
      }
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      if (isCreatingNewTest) {
        formData.append('newTestYear', newTestYear.trim());
        formData.append('newTestNumber', newTestNumber.toString());
        const computedTitle =
          newTestTitle.trim() ||
          `${newTestYear.trim().toUpperCase().startsWith('ETS') ? newTestYear.trim() : 'ETS ' + newTestYear.trim()} - Test ${newTestNumber}`;
        formData.append('newTestTitle', computedTitle);
      } else {
        formData.append('testId', selectedTestId.toString());
      }
      formData.append('part', part.toString());
      formData.append('itemNumber', itemNumber.trim());
      formData.append('title', title.trim());
      formData.append('audioFile', audioFile);
      formData.append('transcriptText', transcriptText.trim());

      // Append questionsJson if provided
      if (validQuestions.length > 0) {
        formData.append('questionsJson', JSON.stringify(validQuestions));
      }

      const res = await api.admin.uploadItem(formData);
      setUploadSuccess(`Đã tạo thành công bài nghe "${res.title}" với ${res.totalSegments} câu phân đoạn tự động!`);
      
      // Reset form
      setItemNumber('');
      setTitle('');
      setAudioFile(null);
      setTranscriptText('');
      setIsCreatingNewTest(false);
      setQuestions([
        { questionNumber: 32, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', explanation: '' },
        { questionNumber: 33, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', explanation: '' },
        { questionNumber: 34, questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', explanation: '' },
      ]);
      setQuickPasteText('');

      loadStats();
      const updatedTests = await api.toeic.getTests();
      setTests(updatedTests);
      if (res.itemId) {
        const testToLoad = isCreatingNewTest
          ? updatedTests.find((t) => String(t.year).includes(newTestYear))?.id || selectedTestId
          : selectedTestId;
        if (testToLoad) {
          api.toeic.getTestItems(Number(testToLoad)).then(setItems);
        }
      }
      onDataChanged?.();
    } catch (err: unknown) {
      let msg = 'Upload thất bại';
      if (err instanceof Error) {
        msg = err.message;
        if (msg.includes('Failed to fetch')) {
          msg = 'Không thể kết nối đến máy chủ Backend hoặc kích thước tập tin vượt quá 50MB. Vui lòng kiểm tra lại dịch vụ Backend.';
        }
      }
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Đề thi ETS áp dụng <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNewTest(!isCreatingNewTest);
                        setUploadError(null);
                      }}
                      className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isCreatingNewTest ? 'Chọn đề có sẵn' : 'Tạo đề thi mới'}</span>
                    </button>
                  </div>

                  {!isCreatingNewTest ? (
                    <select
                      value={selectedTestId}
                      onChange={(e) => {
                        if (e.target.value === 'NEW') {
                          setIsCreatingNewTest(true);
                        } else {
                          setSelectedTestId(Number(e.target.value));
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      {tests.map((t) => (
                        <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                          {t.title} ({t.year})
                        </option>
                      ))}
                      <option value="NEW" className="bg-slate-900 text-emerald-400 font-semibold">
                        + Tạo đề thi mới (Tùy chỉnh năm & số đề)...
                      </option>
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                          <FolderPlus className="w-4 h-4" />
                          Khởi tạo Đề thi ETS mới
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCreatingNewTest(false)}
                          className="text-[11px] text-slate-400 hover:text-slate-200"
                        >
                          Hủy
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            Năm / Bộ đề <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={newTestYear}
                            onChange={(e) => {
                              setNewTestYear(e.target.value);
                              if (!newTestTitle || newTestTitle.startsWith('ETS ')) {
                                setNewTestTitle(`ETS ${e.target.value} - Test ${newTestNumber}`);
                              }
                            }}
                            placeholder="2023 hoặc ETS 2023"
                            className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-300 mb-1">
                            Số thứ tự đề <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={newTestNumber}
                            onChange={(e) => {
                              const num = Math.max(1, parseInt(e.target.value) || 1);
                              setNewTestNumber(num);
                              if (!newTestTitle || newTestTitle.startsWith('ETS ')) {
                                setNewTestTitle(`ETS ${newTestYear} - Test ${num}`);
                              }
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          Tiêu đề hiển thị của Đề thi
                        </label>
                        <input
                          type="text"
                          value={newTestTitle}
                          onChange={(e) => setNewTestTitle(e.target.value)}
                          placeholder={`ETS ${newTestYear} - Test ${newTestNumber}`}
                          className="w-full px-2.5 py-1.5 rounded-lg glass-input text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSaveNewTest}
                          disabled={isSavingTest}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSavingTest ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          <span>Lưu & Chọn đề này</span>
                        </button>
                      </div>
                    </div>
                  )}
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
                    onChange={(e) => handleItemNumberChange(e.target.value)}
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

              {/* TOEIC ETS Multiple-Choice Questions (3 Questions for Hard Mode) */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                        Câu hỏi trắc nghiệm ETS đính kèm (3 câu hỏi)
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Chế độ Nâng cao
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Học viên làm bài ở chế độ Nâng cao sẽ trả lời 3 câu hỏi này sau khi nghe toàn bài
                    </p>
                  </div>

                  {/* Sub-tabs: Form Cards vs Quick-Paste */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setQuestionsMode('cards')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        questionsMode === 'cards'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      <span>Biểu mẫu 3 câu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionsMode('quick-paste')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        questionsMode === 'quick-paste'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ClipboardPaste className="w-3.5 h-3.5" />
                      <span>Nhập nhanh văn bản</span>
                    </button>
                  </div>
                </div>

                {questionsMode === 'quick-paste' ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-slate-300 font-medium">
                        Dán văn bản câu hỏi định dạng ETS / sách luyện thi:
                      </label>
                      <button
                        type="button"
                        onClick={handleParseQuickPaste}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>⚡ Bóc tách câu hỏi tự động</span>
                      </button>
                    </div>

                    <textarea
                      rows={6}
                      value={quickPasteText}
                      onChange={(e) => setQuickPasteText(e.target.value)}
                      placeholder={`32. Where does the conversation most likely take place?\nA. At a hotel\nB. At an office\nC. At a restaurant\nD. At an airport\nĐáp án: B\nGiải thích: Người phụ nữ nói về việc đặt phòng...`}
                      className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-slate-200 font-mono leading-relaxed placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[10px] text-slate-400 italic">
                      Hỗ trợ định dạng "32. Câu hỏi", "A. Đáp án A", "Đáp án: B" và "Giải thích: ..."
                    </p>
                  </div>
                ) : (
                  /* 3-Card Visual Form */
                  <div className="space-y-3">
                    {questions.map((q, qIndex) => (
                      <div
                        key={qIndex}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                            {qIndex + 1}
                          </span>
                          <span className="text-xs font-semibold text-slate-300 shrink-0">
                            Câu số:
                          </span>
                          <input
                            type="number"
                            value={q.questionNumber}
                            onChange={(e) =>
                              updateQuestionField(qIndex, 'questionNumber', parseInt(e.target.value) || 0)
                            }
                            className="w-16 px-2 py-1 rounded-lg glass-input text-xs text-slate-200 shrink-0"
                          />
                          <input
                            type="text"
                            value={q.questionText}
                            onChange={(e) => updateQuestionField(qIndex, 'questionText', e.target.value)}
                            placeholder={`Nội dung câu hỏi ${q.questionNumber}...`}
                            className="flex-1 px-3 py-1 rounded-lg glass-input text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        {/* 4 Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                            const optField = `option${opt}` as keyof CreateQuestionRequest;
                            const isCorrect = q.correctOption === opt;

                            return (
                              <div
                                key={opt}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-colors ${
                                  isCorrect
                                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                                    : 'bg-slate-900/60 border-slate-800'
                                }`}
                              >
                                <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                                  <input
                                    type="radio"
                                    name={`correctOption-${qIndex}`}
                                    checked={isCorrect}
                                    onChange={() => updateQuestionField(qIndex, 'correctOption', opt)}
                                    className="accent-emerald-500 cursor-pointer"
                                  />
                                  <span
                                    className={`text-xs font-bold ${
                                      isCorrect ? 'text-emerald-400' : 'text-slate-400'
                                    }`}
                                  >
                                    {opt}
                                  </span>
                                </label>
                                <input
                                  type="text"
                                  value={(q[optField] as string) || ''}
                                  onChange={(e) => updateQuestionField(qIndex, optField, e.target.value)}
                                  placeholder={`Lựa chọn ${opt}...`}
                                  className="flex-1 bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                                />
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        <div>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => updateQuestionField(qIndex, 'explanation', e.target.value)}
                            placeholder="Giải thích đáp án (tùy chọn)..."
                            className="w-full px-3 py-1 rounded-lg glass-input text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
