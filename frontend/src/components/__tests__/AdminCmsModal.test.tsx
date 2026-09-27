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
});
