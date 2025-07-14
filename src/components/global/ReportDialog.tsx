import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import InteractiveStarRating from './InteractiveStarRating';
import CustomTimePicker from './CustomTimePicker';
import { ReportService } from '@/services/report.service';
import { Report, CreateReportRequest } from '@/types/report';
import { toast } from 'sonner';
import { Clock, MessageSquare, ThumbsUp, ThumbsDown, FileText, X, Check, Star, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Combobox } from '@/components/global/combobox';
import { API_BASE_URL } from '@/config/api';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { 
  FiBold, 
  FiItalic, 
  FiUnderline, 
  FiAlignLeft, 
  FiAlignCenter, 
  FiAlignRight 
} from 'react-icons/fi';
import { BsListUl, BsListOl } from 'react-icons/bs';

interface ReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  clientId: string;
  providerId: string;
  mode: 'create' | 'accept' | 'view';
  existingReport?: Report;
  userRole: 'client' | 'provider';
  onSuccess?: () => void;
}

interface Booking {
  id: string;
  clientId: string;
  providerId: string;
  bookingDate: string;
  proposedStartTime: string;
  proposedEndTime: string;
  status: string;
}

const ReportDialog: React.FC<ReportDialogProps> = ({
  isOpen,
  onClose,
  bookingId,
  clientId,
  providerId,
  mode,
  existingReport,
  userRole,
  onSuccess
}) => {
  const { t } = useTranslation();
  
  // Form state
  const [formData, setFormData] = useState({
    rate: userRole === 'client' ? 0 : 0,
    startTime: '',
    endTime: '',
    comment: '',
    advantages: [] as string[],
    disadvantages: [] as string[]
  });
  
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);

  // Check if report is fully accepted
  const isReportFullyAccepted = existingReport?.providerAccept && existingReport?.clientAccept;

  // Initialize Tiptap editor for comments
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      BulletList.configure({
        keepMarks: true,
        keepAttributes: false,
      }),
      OrderedList.configure({
        keepMarks: true,
        keepAttributes: false,
      }),
      ListItem,
    ],
    content: formData.comment || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      handleFormChange('comment', html);
    },
    editable: !(mode === 'view' || isReportFullyAccepted),
  });

  // Update editor content when formData.comment changes
  useEffect(() => {
    if (editor && formData.comment !== editor.getHTML()) {
      editor.commands.setContent(formData.comment || '');
    }
  }, [editor, formData.comment]);

  // Clear editor when dialog closes
  useEffect(() => {
    if (!isOpen && editor) {
      editor.commands.setContent('');
    }
  }, [isOpen, editor]);

  // Fetch booking data
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/booking/${bookingId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch booking');
        }
        const bookingData = await response.json();
        setBooking(bookingData);
        
        // Set initial time values from booking
        if (bookingData) {
          setFormData(prev => ({
            ...prev,
            startTime: bookingData.proposedStartTime || '',
            endTime: bookingData.proposedEndTime || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error(t('errorFetchingBooking') || 'Error fetching booking details');
      }
    };

    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId, t]);

  // Predefined options
  const advantageOptions = [
    'Professional',
    'On time',
    'Good communication',
    'Quality work',
    'Friendly',
    'Reliable',
    'Efficient',
    'Clean workspace',
    'Fair pricing',
    'Problem solver'
  ];

  const disadvantageOptions = [
    'Late arrival',
    'Poor communication',
    'Incomplete work',
    'Unprofessional',
    'Expensive',
    'Messy',
    'Slow',
    'Unresponsive',
    'Poor quality',
    'Rude behavior'
  ];

  // Initialize form data if editing existing report or creating new one
  useEffect(() => {
    if (!isOpen) {
      // Clear form data when dialog is closed
      setFormData({
        rate: 0,
        startTime: '',
        endTime: '',
        comment: '',
        advantages: [],
        disadvantages: []
      });
      return;
    }

    if (existingReport && mode === 'view') {
      setFormData({
        rate: existingReport.rate,
        startTime: existingReport.startTime || '',
        endTime: existingReport.endTime || '',
        comment: existingReport.comment || '',
        advantages: existingReport.advantages || [],
        disadvantages: existingReport.disadvantages || []
      });
    } else if (mode === 'accept' && existingReport) {
      // For accept mode, start with existing report data
      setFormData({
        rate: userRole === 'client' ? 0 : existingReport.rate,
        startTime: existingReport.startTime || '',
        endTime: existingReport.endTime || '',
        comment: existingReport.comment || '',
        advantages: existingReport.advantages || [],
        disadvantages: existingReport.disadvantages || []
      });
    } else if (mode === 'create') {
      // For create mode, start fresh but use booking times if available
      setFormData({
        rate: userRole === 'client' ? 0 : 0,
        startTime: booking?.proposedStartTime || '',
        endTime: booking?.proposedEndTime || '',
        comment: '',
        advantages: [],
        disadvantages: []
      });
    }
  }, [existingReport, mode, booking, userRole, isOpen]);

  const handleFormChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAdvantageToggle = (advantage: string) => {
    setFormData(prev => ({
      ...prev,
      advantages: prev.advantages.includes(advantage)
        ? prev.advantages.filter(a => a !== advantage)
        : [...prev.advantages, advantage]
    }));
  };

  const handleDisadvantageToggle = (disadvantage: string) => {
    setFormData(prev => ({
      ...prev,
      disadvantages: prev.disadvantages.includes(disadvantage)
        ? prev.disadvantages.filter(d => d !== disadvantage)
        : [...prev.disadvantages, disadvantage]
    }));
  };

  const handleCreateReport = async () => {
    if (!booking) {
      toast.error(t('errorNoBookingData') || 'No booking data available', {
        icon: <AlertCircle className="w-4 h-4" />,
        duration: 4000,
      });
      return;
    }

    setLoading(true);
    
    // Show loading notification
    const loadingToast = toast.loading('Creating service report...', {
      icon: <Clock className="w-4 h-4 animate-spin" />,
    });

    try {
      const reportData: CreateReportRequest = {
        clientId: booking.clientId,
        providerId,
        bookingId,
        rate: userRole === 'client' ? (formData.rate || 0) : 0,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        comment: formData.comment || undefined,
        advantages: formData.advantages.length > 0 ? formData.advantages : undefined,
        disadvantages: formData.disadvantages.length > 0 ? formData.disadvantages : undefined,
        providerAccept: true,
        clientAccept: false,
        rateDate: new Date().toISOString()
      };

      // Create the report
      await ReportService.createReport(reportData);

      // Update booking status to completed
      await fetch(`${API_BASE_URL}/booking/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'completed',
          actualStartTime: formData.startTime,
          actualEndTime: formData.endTime
        })
      });

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Show success notification with animation
      toast.success('🎉 Service report created successfully!', {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        duration: 5000,
        description: 'The client will be notified to review and rate your service.',
        action: {
          label: 'View Report',
          onClick: () => {},
        },
        className: 'animate-pulse',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      toast.error('Failed to create service report', {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        duration: 5000,
        description: 'Please try again or contact support if the problem persists.',
        action: {
          label: 'Retry',
          onClick: () => handleCreateReport(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptReport = async () => {
    if (!existingReport || !booking) return;
    
    setLoading(true);
    
    // Show loading notification
    const loadingToast = toast.loading('Processing your feedback...', {
      icon: <Clock className="w-4 h-4 animate-spin" />,
    });

    try {
      // Update report with client's rating and comments
      await ReportService.updateReport(existingReport.id, {
        rate: formData.rate,
        comment: formData.comment || undefined,
        advantages: formData.advantages.length > 0 ? formData.advantages : undefined,
        disadvantages: formData.disadvantages.length > 0 ? formData.disadvantages : undefined,
        rateDate: new Date().toISOString()
      });
      
      // Accept the report
      await ReportService.clientAcceptReport(existingReport.id);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Show success notification with stars
      const ratingStars = '⭐'.repeat(formData.rate);
      toast.success(`${ratingStars} Thank you for your feedback!`, {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        duration: 6000,
        description: `You rated this service ${formData.rate} star${formData.rate !== 1 ? 's' : ''}. The provider has been notified.`,
        action: {
          label: 'Share Review',
          onClick: () => {},
        },
        className: 'animate-bounce',
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      toast.error('Failed to submit your feedback', {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        duration: 5000,
        description: 'Your rating and comments could not be saved. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => handleAcceptReport(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectReport = async () => {
    if (!existingReport) return;
    
    setLoading(true);
    
    // Show loading notification
    const loadingToast = toast.loading('Rejecting service report...', {
      icon: <Clock className="w-4 h-4 animate-spin" />,
    });

    try {
      await ReportService.deleteReport(existingReport.id);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      toast.success('Report rejected successfully', {
        icon: <CheckCircle className="w-4 h-4 text-orange-500" />,
        duration: 4000,
        description: 'The provider will be notified and can submit a new report.',
        action: {
          label: 'Undo',
          onClick: () => {},
        },
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      toast.error('Failed to reject report', {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        duration: 5000,
        description: 'Unable to reject the report. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => handleRejectReport(),
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-teal-600" />
            {mode === 'create' ? 'Create Service Report' : mode === 'accept' ? 'Review Service Report' : 'Service Report'}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {mode === 'create' ? 'Please provide details about the service you provided.' : 
             mode === 'accept' ? 'Review the service report and provide your feedback.' : 
             'Service report details.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Section - Only for client role and not in view mode */}
          {userRole === 'client' && mode !== 'view' && (
            <div className="space-y-4 p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm">
              <Label className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" />
                {t('serviceReport.serviceRating')}
              </Label>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex justify-center">
                  <InteractiveStarRating
                    rating={formData.rate || 0}
                    onRatingChange={(rating) => handleFormChange('rate', rating)}
                    disabled={mode !== 'create' && mode !== 'accept' || isReportFullyAccepted}
                    size="3xl"
                    className="transform hover:scale-105 transition-transform duration-200"
                  />
                </div>
                {formData.rate > 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(formData.rate)].map((_, i) => (
                        <Star key={i} className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                      {formData.rate} {formData.rate === 1 ? t('serviceReport.star') : t('serviceReport.stars')} selected
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Time Section - Only for provider role and not in view mode */}
          {userRole === 'provider' && mode !== 'view' && (
            <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm">
              <Label className="text-lg font-semibold text-blue-900 flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                {t('serviceReport.serviceDetails')}
              </Label>
              {booking?.bookingDate && (
                <div className="flex items-center mb-2">
                  <div className="flex-1 flex flex-col items-center bg-white border border-blue-100 rounded-xl p-4 shadow-sm">
                    <span className="flex items-center gap-2 text-blue-700 font-semibold text-base mb-1">
                      <Calendar className="w-5 h-5 text-blue-500" /> {t('serviceReport.bookingDate')}
                    </span>
                    <span className="text-base font-bold text-blue-900">
                      {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">
                    {t('serviceReport.startTime')}
                  </Label>
                  <CustomTimePicker
                    value={formData.startTime}
                    onChange={(time) => handleFormChange('startTime', time)}
                    minTime="00:00"
                    maxTime="23:59"
                    step={5}
                    className={`w-full ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    availableTimes={[]}
                    isGeneralRequest={true}
                    disabled={isReportFullyAccepted}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">
                    {t('serviceReport.endTime')}
                  </Label>
                  <CustomTimePicker
                    value={formData.endTime}
                    onChange={(time) => handleFormChange('endTime', time)}
                    minTime={formData.startTime || "00:00"}
                    maxTime="23:59"
                    step={5}
                    className={`w-full ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    availableTimes={[]}
                    isGeneralRequest={true}
                    disabled={isReportFullyAccepted}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Advantages and Disadvantages - Only for client role and not in view mode */}
          {userRole === 'client' && mode !== 'view' && (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Advantages */}
              <div className="flex-1 space-y-4 bg-green-50 border border-green-100 rounded-xl p-4 shadow-sm">
                <Label className="text-lg font-semibold text-green-800 flex items-center gap-2">
                  <ThumbsUp className="w-5 h-5 text-green-600" />
                  Positive Aspects
                </Label>
                {formData.advantages.length > 0 && (
                  <div className="mb-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <h4 className="text-sm font-medium text-teal-800 mb-2">Selected:</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.advantages.map((advantage) => (
                        <div
                          key={advantage}
                          className={`flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full text-[10px] ${isReportFullyAccepted ? 'cursor-not-allowed opacity-50' : ''}`}
                          onClick={() => !isReportFullyAccepted && handleAdvantageToggle(advantage)}
                        >
                          <ThumbsUp className="w-3 h-3 text-green-500" />
                          <span>{advantage}</span>
                          {!isReportFullyAccepted && <span className="text-teal-600 hover:text-teal-800 cursor-pointer">×</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Combobox>
                  {advantageOptions.map((advantage) => {
                    const isSelected = formData.advantages.includes(advantage);
                    return (
                      <div
                        key={advantage}
                        className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md transition-colors border-green-200 
                          ${isSelected ? 'bg-green-200 text-green-800' : 'hover:bg-green-100'} 
                          ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (!isReportFullyAccepted && !isSelected) handleAdvantageToggle(advantage);
                        }}
                        aria-disabled={isSelected || isReportFullyAccepted}
                      >
                        <ThumbsUp className="w-4 h-4 text-green-500" />
                        <span>{advantage}</span>
                        {isSelected && <Check className="w-4 h-4 text-green-600 ml-auto" />}
                      </div>
                    );
                  })}
                </Combobox>
              </div>
              {/* Disadvantages */}
              <div className="flex-1 space-y-4 bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm">
                <Label className="text-lg font-semibold text-red-800 flex items-center gap-2">
                  <ThumbsDown className="w-5 h-5 text-red-600" />
                  Areas for Improvement
                </Label>
                {formData.disadvantages.length > 0 && (
                  <div className="mb-4 p-3 bg-red-100 rounded-lg border border-red-200">
                    <h4 className="text-sm font-medium text-red-800 mb-2">Selected:</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.disadvantages.map((disadvantage) => (
                        <div
                          key={disadvantage}
                          className={`flex items-center gap-1 px-2 py-0.5 bg-red-200 text-red-800 rounded-full text-[10px] ${isReportFullyAccepted ? 'cursor-not-allowed opacity-50' : ''}`}
                          onClick={() => !isReportFullyAccepted && handleDisadvantageToggle(disadvantage)}
                        >
                          <ThumbsDown className="w-3 h-3 text-red-500" />
                          <span>{disadvantage}</span>
                          {!isReportFullyAccepted && <span className="text-red-600 hover:text-red-800 cursor-pointer">×</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Combobox>
                  {disadvantageOptions.map((disadvantage) => {
                    const isSelected = formData.disadvantages.includes(disadvantage);
                    return (
                      <div
                        key={disadvantage}
                        className={`flex items-center gap-2 p-2 cursor-pointer border rounded-md transition-colors border-red-200 
                          ${isSelected ? 'bg-red-200 text-red-800' : 'hover:bg-red-100'} 
                          ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (!isReportFullyAccepted && !isSelected) handleDisadvantageToggle(disadvantage);
                        }}
                        aria-disabled={isSelected || isReportFullyAccepted}
                      >
                        <ThumbsDown className="w-4 h-4 text-red-500" />
                        <span>{disadvantage}</span>
                        {isSelected && <Check className="w-4 h-4 text-red-600 ml-auto" />}
                      </div>
                    );
                  })}
                </Combobox>
              </div>
            </div>
          )}

          {/* Comment Section - Only for client role and not in view mode */}
          {userRole === 'client' && mode !== 'view' && (
            <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <Label className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                Additional Comments
              </Label>
              <div className={`relative ${isReportFullyAccepted ? 'opacity-50' : ''}`}>
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-2 border-b bg-gray-50">
                    <button
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      disabled={isReportFullyAccepted}
                      className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('bold') ? 'bg-gray-200' : ''} ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiBold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      disabled={isReportFullyAccepted}
                      className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('italic') ? 'bg-gray-200' : ''} ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiItalic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      disabled={isReportFullyAccepted}
                      className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('underline') ? 'bg-gray-200' : ''} ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiUnderline className="w-4 h-4" />
                    </button>
                    <Separator orientation="vertical" className="h-6" />
                    <button
                      onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                      disabled={isReportFullyAccepted}
                      className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''} ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiAlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                      disabled={isReportFullyAccepted}
                      className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''} ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiAlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                      disabled={isReportFullyAccepted}
                      className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''} ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <FiAlignRight className="w-4 h-4" />
                    </button>
                    <Separator orientation="vertical" className="h-6" />
                    <button
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      disabled={isReportFullyAccepted}
                      className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('bulletList') ? 'bg-gray-200' : ''} ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <BsListUl className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      disabled={isReportFullyAccepted}
                      className={`p-1 rounded hover:bg-gray-200 ${editor?.isActive('orderedList') ? 'bg-gray-200' : ''} ${isReportFullyAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <BsListOl className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative">
                    <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[200px]" />
                    {(!formData.comment || formData.comment === '<p></p>') && (
                      <div className="absolute top-4 left-4 text-gray-400 pointer-events-none">
                        Share your experience, feedback, or any additional details about the service...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* View Mode - Show all information in a clean format */}
          {mode === 'view' && existingReport && (
            <div className="space-y-6">
              <div className="space-y-4 p-6 bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-100 shadow-sm">
                <Label className="text-lg font-semibold text-teal-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" />
                  {t('serviceReport.serviceDetails')}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-teal-100">
                    <span className="text-sm font-medium text-teal-700">{t('serviceReport.startTime')}</span>
                    <p className="text-lg font-semibold text-teal-900">{existingReport.startTime || 'Not specified'}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-teal-100">
                    <span className="text-sm font-medium text-teal-700">{t('serviceReport.endTime')}</span>
                    <p className="text-lg font-semibold text-teal-900">{existingReport.endTime || 'Not specified'}</p>
                  </div>
                  {booking?.bookingDate && (
                    <div className="bg-white p-4 rounded-lg border border-teal-100">
                      <span className="text-sm font-medium text-teal-700">{t('serviceReport.serviceDate')}</span>
                      <p className="text-lg font-semibold text-teal-900">
                        {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {existingReport.rate > 0 && (
                <div className="space-y-4 p-6 bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-100 shadow-sm">
                  <Label className="text-lg font-semibold text-yellow-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    {t('serviceReport.serviceRating')}
                  </Label>
                  <div className="bg-white p-6 rounded-lg border border-yellow-100">
                    <div className="flex items-center justify-center gap-3">
                      {[...Array(existingReport.rate)].map((_, i) => (
                        <Star 
                          key={i} 
                          className="w-20 h-20 text-yellow-400 fill-yellow-400 animate-pulse hover:scale-110 transition-all duration-300 cursor-pointer drop-shadow-lg" 
                          style={{
                            animationDelay: `${i * 0.1}s`,
                            animationDuration: '2s'
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-center mt-4 text-lg font-medium text-yellow-700">
                      {existingReport.rate} {existingReport.rate === 1 ? t('serviceReport.star') : t('serviceReport.stars')}
                    </p>
                    {existingReport.createdAt && (
                      <p className="text-center mt-2 text-sm text-yellow-600 flex items-center justify-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {t('serviceReport.ratedOn', { date: new Date(existingReport.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {((existingReport.advantages && existingReport.advantages.length > 0) || 
                (existingReport.disadvantages && existingReport.disadvantages.length > 0)) && (
                <div className="space-y-4 p-6 bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 shadow-sm">
                  <Label className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    {t('serviceReport.serviceFeedback')}
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {existingReport.advantages && existingReport.advantages.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-purple-100">
                        <h4 className="text-sm font-medium text-purple-700 mb-2">Positive Aspects</h4>
                        <div className="flex flex-wrap gap-2">
                          {existingReport.advantages.map((advantage) => (
                            <div
                              key={advantage}
                              className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                            >
                              <ThumbsUp className="w-3 h-3 text-purple-500" />
                              <span>{advantage}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {existingReport.disadvantages && existingReport.disadvantages.length > 0 && (
                      <div className="bg-white p-4 rounded-lg border border-purple-100">
                        <h4 className="text-sm font-medium text-purple-700 mb-2">Areas for Improvement</h4>
                        <div className="flex flex-wrap gap-2">
                          {existingReport.disadvantages.map((disadvantage) => (
                            <div
                              key={disadvantage}
                              className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs"
                            >
                              <ThumbsDown className="w-3 h-3 text-purple-500" />
                              <span>{disadvantage}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {existingReport.comment && (
                <div className="space-y-4 p-6 bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-100 shadow-sm">
                  <Label className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    {t('serviceReport.additionalComments')}
                  </Label>
                  <div className="bg-white p-4 rounded-lg border border-blue-100">
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: existingReport.comment }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Separator />

        <DialogFooter className="gap-2">
          {mode === 'create' && !isReportFullyAccepted && (
            <>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                {t('serviceReport.cancel')}
              </Button>
              <Button 
                onClick={handleCreateReport} 
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading ? 'Creating...' : 'Create Report'}
              </Button>
            </>
          )}
          
          {mode === 'accept' && !isReportFullyAccepted && (
            <div className='flex justify-between items-center w-full'>
              <Button variant="outline" onClick={onClose} disabled={loading}>
                <X className="w-4 h-4 mr-2" />
                {t('serviceReport.cancel')}
              </Button>
              <div className='flex gap-2'>
                <Button 
                  variant="destructive" 
                  onClick={handleRejectReport} 
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  {loading ? 'Rejecting...' : 'Reject'}
                </Button>
                <Button 
                  onClick={handleAcceptReport} 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {loading ? 'Accepting...' : 'Accept Report'}
                </Button>
              </div>
            </div>
          )}

          {mode === 'view' && (
            <Button variant="outline" onClick={onClose} disabled={loading}>
              {t('serviceReport.close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;