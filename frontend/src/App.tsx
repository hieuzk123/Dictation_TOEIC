import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { TestSelector } from './components/TestSelector';
import { AuthModal } from './components/AuthModal';
import { DictationPlayer } from './components/DictationPlayer';
import { ResultModal } from './components/ResultModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { api } from './services/api';
import type {
  ToeicTest,
  AudioItemSummary,
  AudioItemDetail,
  SubmitStudyRequest,
  SubmitStudyResponse,
} from './types';
import { Loader2 } from 'lucide-react';

function DictationApp() {
  const { user, openAuthModal } = useAuth();
  const [tests, setTests] = useState<ToeicTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<ToeicTest | null>(null);
  const [items, setItems] = useState<AudioItemSummary[]>([]);
  const [loadingTests, setLoadingTests] = useState<boolean>(true);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState<AudioItemDetail | null>(null);
  const [loadingItemDetail, setLoadingItemDetail] = useState<boolean>(false);

  // Results & History State
  const [studyResult, setStudyResult] = useState<SubmitStudyResponse | null>(null);
  const [isSubmittingStudy, setIsSubmittingStudy] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Load tests on mount
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoadingTests(true);
        const data = await api.toeic.getTests();
        setTests(data);
        if (data.length > 0) {
          setSelectedTest(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch tests:', err);
      } finally {
        setLoadingTests(false);
      }
    };

    fetchTests();
  }, []);

  // Load items when selected test changes
  useEffect(() => {
    if (!selectedTest) return;

    const fetchItems = async () => {
      try {
        setLoadingItems(true);
        const data = await api.toeic.getTestItems(selectedTest.id);
        setItems(data);
      } catch (err) {
        console.error('Failed to fetch items:', err);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [selectedTest]);

  // Handle selecting an item to practice
  const handleSelectItem = async (summary: AudioItemSummary) => {
    try {
      setLoadingItemDetail(true);
      const detail = await api.toeic.getItemDetail(summary.id);
      setSelectedItemDetail(detail);
    } catch (err) {
      console.error('Failed to load item detail:', err);
      alert('Không thể tải chi tiết bài nghe. Vui lòng kiểm tra kết nối backend.');
    } finally {
      setLoadingItemDetail(false);
    }
  };

  const handleBackToTests = () => {
    setSelectedItemDetail(null);
    setStudyResult(null);
  };

  // Handle submitting the dictation session
  const handleFinishSession = async (submission: SubmitStudyRequest) => {
    if (!user) {
      // Prompt user to log in so the score can be saved, or login with demo
      const shouldLogin = confirm(
        'Bạn cần đăng nhập để lưu kết quả và tính điểm vào lịch sử học tập. Bạn có muốn đăng nhập ngay không?'
      );
      if (shouldLogin) {
        openAuthModal();
        return;
      }
    }

    try {
      setIsSubmittingStudy(true);
      const res = await api.study.submit(submission);
      setStudyResult(res);
    } catch (err: any) {
      console.error('Failed to submit study session:', err);
      alert(err.message || 'Đã có lỗi xảy ra khi nộp bài.');
    } finally {
      setIsSubmittingStudy(false);
    }
  };

  const handleRetry = () => {
    setStudyResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        onHomeClick={handleBackToTests}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingTests ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-xs text-slate-400">Đang tải danh sách đề thi từ server...</p>
          </div>
        ) : selectedItemDetail ? (
          /* Workspace View */
          <DictationPlayer
            item={selectedItemDetail}
            onBack={handleBackToTests}
            onFinishSession={handleFinishSession}
          />
        ) : (
          /* Test & Items Browser */
          <TestSelector
            tests={tests}
            selectedTest={selectedTest}
            onSelectTest={setSelectedTest}
            items={items}
            loadingItems={loadingItems}
            onSelectItem={handleSelectItem}
          />
        )}
      </main>

      {/* Submitting Loading Overlay */}
      {isSubmittingStudy && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
            <span className="text-xs text-slate-200 font-medium">Đang chấm điểm và lưu kết quả...</span>
          </div>
        </div>
      )}

      {/* Results Modal */}
      <ResultModal
        result={studyResult}
        onClose={() => setStudyResult(null)}
        onRetry={handleRetry}
        onBackToTests={handleBackToTests}
      />

      {/* History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      {/* Loading overlay for item detail */}
      {loadingItemDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
            <span className="text-xs text-slate-200 font-medium">Đang tải bài nghe...</span>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DictationApp />
    </AuthProvider>
  );
}
