import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminCmsModal } from '../AdminCmsModal';
import { api } from '../../services/api';

vi.mock('../../services/api', () => ({
  api: {
    toeic: {
      getTests: vi.fn(),
      getTestItems: vi.fn(),
    },
    admin: {
      getStats: vi.fn(),
      createTest: vi.fn(),
      uploadItem: vi.fn(),
      deleteItem: vi.fn(),
    },
  },
}));

describe('AdminCmsModal Component', () => {
  const mockTests = [
    { id: 1, title: 'ETS 2024 - Test 1', year: 2024, testNumber: 1, description: 'Desc' },
  ];

  const mockStats = {
    totalTests: 1,
    totalAudioItems: 2,
    totalSegments: 10,
    totalUsers: 5,
    totalStudySessions: 12,
  };

  const mockItems = [
    {
      id: 101,
      testId: 1,
      part: 3,
      itemNumber: 32,
      title: 'Office Supply Toner',
      audioUrl: '/audio/test.mp3',
      totalDuration: 30,
      totalSegments: 7,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.toeic.getTests).mockResolvedValue(mockTests);
    vi.mocked(api.admin.getStats).mockResolvedValue(mockStats);
    vi.mocked(api.toeic.getTestItems).mockResolvedValue(mockItems);
    vi.mocked(api.admin.createTest).mockResolvedValue({
      id: 2,
      title: 'ETS 2023 - Test 2',
      year: 2023,
      testNumber: 2,
    });
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <AdminCmsModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal header, tabs, and upload form when isOpen is true', async () => {
    render(<AdminCmsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Quản trị Đề thi & Nội dung/)).toBeInTheDocument();
    expect(screen.getByText('ROLE_ADMIN')).toBeInTheDocument();
    expect(screen.getByText(/Tải lên đề mới/)).toBeInTheDocument();
    expect(screen.getByText(/Quản lý & Thống kê/)).toBeInTheDocument();

    await waitFor(() => {
      expect(api.toeic.getTests).toHaveBeenCalled();
    });
  });

  it('toggles new test creation form and calls api.admin.createTest', async () => {
    render(<AdminCmsModal isOpen={true} onClose={vi.fn()} />);

    const createTestToggleBtn = screen.getByRole('button', { name: /Tạo đề thi mới/i });
    fireEvent.click(createTestToggleBtn);

    expect(screen.getByText(/Khởi tạo Đề thi ETS mới/)).toBeInTheDocument();

    const saveTestBtn = screen.getByText(/Lưu & Chọn đề này/);
    fireEvent.click(saveTestBtn);

    await waitFor(() => {
      expect(api.admin.createTest).toHaveBeenCalledWith(
        expect.objectContaining({
          year: '2023',
          testNumber: 1,
        })
      );
    });
  });

  it('switches to stats & manage tab and renders metrics', async () => {
    render(<AdminCmsModal isOpen={true} onClose={vi.fn()} />);

    const manageTab = screen.getByText(/Quản lý & Thống kê/);
    fireEvent.click(manageTab);

    await waitFor(() => {
      expect(api.admin.getStats).toHaveBeenCalled();
      expect(screen.getByText('Câu đục lỗ')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument(); // totalSegments
      expect(screen.getByText('Học viên')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument(); // totalUsers
    });
  });

  it('switches to quick-paste tab, parses pasted questions, and populates form cards', async () => {
    render(<AdminCmsModal isOpen={true} onClose={vi.fn()} />);

    // Click on "Nhập nhanh văn bản"
    const quickPasteBtn = screen.getByRole('button', { name: /Nhập nhanh văn bản/i });
    fireEvent.click(quickPasteBtn);

    const textarea = screen.getByPlaceholderText(/32\. Where does the conversation most likely take place/i);
    expect(textarea).toBeInTheDocument();

    const sampleText = `
35. What is the speaker announcing?
A. A flight delay
B. A schedule change
C. A promotion
D. A company party
Đáp án: B
Giải thích: Speaker mentions the change in shift times.
`;
    fireEvent.change(textarea, { target: { value: sampleText } });

    // Click "⚡ Bóc tách câu hỏi tự động"
    const parseBtn = screen.getByRole('button', { name: /Bóc tách câu hỏi tự động/i });
    fireEvent.click(parseBtn);

    // After parsing, it should show success message and switch back to cards
    await waitFor(() => {
      expect(screen.getByText(/Đã bóc tách tự động thành công 1 câu hỏi/i)).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('What is the speaker announcing?')).toBeInTheDocument();
    expect(screen.getByDisplayValue('A schedule change')).toBeInTheDocument();
  });

  it('includes questionsJson in FormData when uploading item with questions', async () => {
    vi.mocked(api.admin.uploadItem).mockResolvedValue({
      itemId: 201,
      title: 'Office Discussion',
      audioUrl: '/audio/office.mp3',
      totalSegments: 5,
      message: 'Success',
    });

    render(<AdminCmsModal isOpen={true} onClose={vi.fn()} />);

    // Wait for tests to load
    await waitFor(() => {
      expect(api.toeic.getTests).toHaveBeenCalled();
    });

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('35-37'), { target: { value: '32-34' } });
    fireEvent.change(screen.getByPlaceholderText('Office Equipment Discussion'), {
      target: { value: 'Office Discussion' },
    });

    // Provide a mock file
    const file = new File(['dummy audio content'], 'audio.mp3', { type: 'audio/mp3' });
    const fileInput = document.getElementById('audio-upload-input') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Fill Question 1 in the form
    const q1Input = screen.getByPlaceholderText('Nội dung câu hỏi 32...');
    fireEvent.change(q1Input, { target: { value: 'Where is the conversation taking place?' } });
    fireEvent.change(screen.getAllByPlaceholderText('Lựa chọn A...')[0], { target: { value: 'At a bank' } });
    fireEvent.change(screen.getAllByPlaceholderText('Lựa chọn B...')[0], { target: { value: 'At a store' } });
    fireEvent.change(screen.getAllByPlaceholderText('Lựa chọn C...')[0], { target: { value: 'At a hotel' } });
    fireEvent.change(screen.getAllByPlaceholderText('Lựa chọn D...')[0], { target: { value: 'At an airport' } });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Tải lên & Khởi tạo Đề thi/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.admin.uploadItem).toHaveBeenCalled();
    });

    const formDataPassed = vi.mocked(api.admin.uploadItem).mock.calls[0][0];
    expect(formDataPassed.get('itemNumber')).toBe('32-34');
    expect(formDataPassed.get('title')).toBe('Office Discussion');
    const questionsJson = formDataPassed.get('questionsJson') as string;
    expect(questionsJson).toBeDefined();
    expect(questionsJson).toContain('Where is the conversation taking place?');
    expect(questionsJson).toContain('At a bank');
  });
});

