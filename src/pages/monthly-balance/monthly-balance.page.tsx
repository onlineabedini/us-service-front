// Monthly Balance Page for Providers
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '@/utils/authCookieService';
import { API_BASE_URL } from '@/config/api';
import { bookingService } from '@/services/booking.service';
import { ReportService } from '@/services/report.service';
import { toast } from 'sonner';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Footer from '@/components/layout/footer';
import ChangeLang from '@/components/global/changeLangDropdonw';
import { Report } from '@/types/report';

// Types for monthly balance data
interface MonthlyBalance {
  month: string;
  year: number;
  totalJobs: number;
  completedJobs: number;
  pendingJobs: number;
  totalEarnings: number;
  averageRating: number;
  totalHours: number;
  jobs: Job[];
}

interface Job {
  id: string;
  clientId: string;
  providerId: string;
  bookingDate: string;
  typeOfService: string[];
  proposedStartTime: string;
  proposedEndTime: string;
  actualStartTime: string | null;
  actualEndTime: string | null;
  status: string;
  serviceAddress: string;
  agreedHourlyPrice: number;
  totalPrice: string;
  finalPrice: string;
  stars: number;
  createdAt: string;
  clientAccept?: boolean;
  providerAccept?: boolean;
}

const MonthlyBalancePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyBalance[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);

  // Get available years from data
  const availableYears = Array.from(
    new Set(monthlyData.map(item => item.year))
  ).sort((a, b) => b - a);

  // Get available months for selected year
  const availableMonths = monthlyData
    .filter(item => item.year === selectedYear)
    .map(item => item.month)
    .sort((a, b) => {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      return months.indexOf(a) - months.indexOf(b);
    });

  // Calculate total statistics for selected period
  const totalStats = React.useMemo(() => {
    const filteredData = selectedMonth 
      ? monthlyData.filter(item => item.year === selectedYear && item.month === selectedMonth)
      : monthlyData.filter(item => item.year === selectedYear);

    return filteredData.reduce((acc, item) => ({
      totalJobs: acc.totalJobs + item.totalJobs,
      completedJobs: acc.completedJobs + item.completedJobs,
      pendingJobs: acc.pendingJobs + item.pendingJobs,
      totalEarnings: acc.totalEarnings + item.totalEarnings,
      totalHours: acc.totalHours + item.totalHours,
      averageRating: acc.averageRating + (item.averageRating * item.completedJobs),
      totalCompletedJobs: acc.totalCompletedJobs + item.completedJobs
    }), {
      totalJobs: 0,
      completedJobs: 0,
      pendingJobs: 0,
      totalEarnings: 0,
      totalHours: 0,
      averageRating: 0,
      totalCompletedJobs: 0
    });
  }, [monthlyData, selectedYear, selectedMonth]);

  // Calculate average rating
  const averageRating = totalStats.totalCompletedJobs > 0 
    ? totalStats.averageRating / totalStats.totalCompletedJobs 
    : 0;

  // Fetch provider data and bookings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const providerIdFromCookie = getCookie('providerId');
        
        if (!providerIdFromCookie) {
          setError('Provider not found. Please log in.');
          return;
        }

        setProviderId(providerIdFromCookie);

        // Fetch all bookings for the provider
        const bookings = await bookingService.getProviderBookings(providerIdFromCookie);
        
        // Fetch all reports for the provider
        const reports = await ReportService.getReportsByProvider(providerIdFromCookie);

        // Process data by month
        const monthlyStats = processMonthlyData(bookings, reports);
        setMonthlyData(monthlyStats);

      } catch (err) {
        console.error('Error fetching monthly balance data:', err);
        setError('Failed to load monthly balance data');
        toast.error('Failed to load monthly balance data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper: Safely calculate hours between two date/time strings
  function calculateHours(start: string | null | undefined, end: string | null | undefined): number {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
    const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return hours > 0 ? hours : 0;
  }

  // Process bookings and reports into monthly statistics
  const processMonthlyData = (bookings: Job[], reports: Report[]): MonthlyBalance[] => {
    const monthlyMap = new Map<string, MonthlyBalance>();

    // Process each booking
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.bookingDate);
      const month = bookingDate.toLocaleString('en-US', { month: 'long' });
      const year = bookingDate.getFullYear();
      const key = `${year}-${month}`;

      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          month,
          year,
          totalJobs: 0,
          completedJobs: 0,
          pendingJobs: 0,
          totalEarnings: 0,
          averageRating: 0,
          totalHours: 0,
          jobs: []
        });
      }

      const monthlyData = monthlyMap.get(key)!;
      monthlyData.totalJobs++;
      monthlyData.jobs.push(booking);

      // Calculate earnings
      const earnings = parseFloat(booking.finalPrice || booking.totalPrice || '0');
      monthlyData.totalEarnings += earnings;

      // Calculate hours worked
      let hours = 0;
      if (booking.actualStartTime && booking.actualEndTime) {
        // Use actual times if available
        hours = calculateHours(booking.actualStartTime, booking.actualEndTime);
      } else if (booking.proposedStartTime && booking.proposedEndTime) {
        // Fallback to proposed times (use a fixed date for time-only strings)
        const start = `2000-01-01T${booking.proposedStartTime}`;
        const end = `2000-01-01T${booking.proposedEndTime}`;
        hours = calculateHours(start, end);
      }
      monthlyData.totalHours += hours;

      // Count by status
      if (booking.status === 'completed') {
        monthlyData.completedJobs++;
      } else if (booking.status === 'pending' || booking.status === 'scheduled') {
        monthlyData.pendingJobs++;
      }
    });

    // Process reports for ratings
    reports.forEach(report => {
      const reportDate = new Date(report.createdAt);
      const month = reportDate.toLocaleString('en-US', { month: 'long' });
      const year = reportDate.getFullYear();
      const key = `${year}-${month}`;

      if (monthlyMap.has(key) && report.clientAccept && report.providerAccept) {
        const monthlyData = monthlyMap.get(key)!;
        monthlyData.averageRating += report.rate;
      }
    });

    // Calculate average ratings
    monthlyMap.forEach((data, key) => {
      const completedJobsWithRating = data.jobs.filter(job => 
        job.status === 'completed' && 
        reports.some(report => 
          (report.bookingId ?? '') === job.id && 
          report.clientAccept && 
          report.providerAccept
        )
      ).length;

      if (completedJobsWithRating > 0) {
        data.averageRating = data.averageRating / completedJobsWithRating;
      }
    });

    return Array.from(monthlyMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format hours
  const formatHours = (hours: number) => {
    return `${Math.round(hours)}h`;
  };

  // Handle year change
  const handleYearChange = (year: string) => {
    setSelectedYear(parseInt(year));
    setSelectedMonth(null);
  };

  // Handle month change
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month === 'all' ? null : month);
  };

  // Export data function
  const handleExportData = () => {
    const dataToExport = selectedMonth 
      ? monthlyData.filter(item => item.year === selectedYear && item.month === selectedMonth)
      : monthlyData.filter(item => item.year === selectedYear);

    const csvContent = [
      ['Month', 'Year', 'Total Jobs', 'Completed Jobs', 'Pending Jobs', 'Total Earnings (SEK)', 'Average Rating', 'Total Hours'],
      ...dataToExport.map(item => [
        item.month,
        item.year.toString(),
        item.totalJobs.toString(),
        item.completedJobs.toString(),
        item.pendingJobs.toString(),
        item.totalEarnings.toString(),
        item.averageRating.toFixed(1),
        Math.round(item.totalHours).toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-balance-${selectedYear}${selectedMonth ? `-${selectedMonth}` : ''}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('loading') || 'Loading...'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>
              {t('goHome') || 'Go Home'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      {/* Beautiful Header Section */}
      <div className="w-full bg-gradient-to-r from-teal-600 to-teal-400 py-10 shadow-md mb-8">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center">
          <div className="flex items-center justify-center mb-4">
            <BarChart3 className="h-10 w-10 text-white mr-2" />
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white drop-shadow-lg">
              {t('monthlyBalance.title') || 'Monthly Balance'}
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-white/90 font-medium max-w-2xl">
            {t('monthlyBalance.subtitle') || 'Track your earnings and job statistics'}
          </p>
        </div>
      </div>

          {/* Main Container */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Filters and Export */}
        <div className="bg-white/90 rounded-2xl shadow-lg border p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-teal-500" />
              <span className="text-base font-semibold text-gray-700">
                {t('monthlyBalance.filters') || 'Filters'}
              </span>
            </div>
            <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth || 'all'} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t('monthlyBalance.allMonths') || 'All Months'}
                </SelectItem>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleExportData} variant="default" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white shadow-md transition">
            <Download className="h-4 w-4 mr-2" />
            {t('monthlyBalance.export') || 'Export'}
          </Button>
        </div>

        {/* Summary Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Card: Total Jobs */}
          <Card className="rounded-xl shadow-md hover:shadow-xl transition border-0 bg-gradient-to-br from-white to-teal-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {t('monthlyBalance.totalJobs') || 'Total Jobs'}
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-700">{totalStats.totalJobs}</div>
              <p className="text-xs text-gray-500">
                {t('monthlyBalance.allTime') || 'All time'}
              </p>
            </CardContent>
          </Card>
          {/* Card: Completed Jobs */}
          <Card className="rounded-xl shadow-md hover:shadow-xl transition border-0 bg-gradient-to-br from-white to-green-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {t('monthlyBalance.completedJobs') || 'Completed Jobs'}
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{totalStats.completedJobs}</div>
              <p className="text-xs text-gray-500">
                {totalStats.totalJobs > 0 ? `${Math.round((totalStats.completedJobs / totalStats.totalJobs) * 100)}% completion` : 'No jobs yet'}
              </p>
            </CardContent>
          </Card>
          {/* Card: Total Earnings */}
          <Card className="rounded-xl shadow-md hover:shadow-xl transition border-0 bg-gradient-to-br from-white to-emerald-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {t('monthlyBalance.totalEarnings') || 'Total Earnings'}
              </CardTitle>
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-700">
                {formatCurrency(totalStats.totalEarnings)}
              </div>
              <p className="text-xs text-gray-500">
                {t('monthlyBalance.grossEarnings') || 'Gross earnings'}
              </p>
            </CardContent>
          </Card>
          {/* Card: Average Rating */}
          <Card className="rounded-xl shadow-md hover:shadow-xl transition border-0 bg-gradient-to-br from-white to-yellow-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {t('monthlyBalance.averageRating') || 'Average Rating'}
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-700">
                {averageRating.toFixed(1)}
              </div>
              <p className="text-xs text-gray-500">
                {totalStats.totalCompletedJobs > 0 ? `${totalStats.totalCompletedJobs} ${t('monthlyBalance.ratings') || 'ratings'}` : 'No ratings yet'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card className="rounded-xl shadow-md border-0 bg-gradient-to-br from-white to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Clock className="h-5 w-5" />
                <span>{t('monthlyBalance.totalHours') || 'Total Hours Worked'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                {formatHours(totalStats.totalHours)}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {t('monthlyBalance.estimatedHours') || 'Estimated from booking times'}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-md border-0 bg-gradient-to-br from-white to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <AlertCircle className="h-5 w-5" />
                <span>{t('monthlyBalance.pendingJobs') || 'Pending Jobs'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-700">
                {totalStats.pendingJobs}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {t('monthlyBalance.scheduledOrPending') || 'Scheduled or pending completion'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Breakdown Section */}
        <Card className="rounded-2xl shadow-lg border-0 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-teal-700">
              <Calendar className="h-5 w-5" />
              <span>{t('monthlyBalance.monthlyBreakdown') || 'Monthly Breakdown'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {t('monthlyBalance.noData') || 'No data available for the selected period'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {monthlyData
                  .filter(item =>
                    item.year === selectedYear &&
                    (!selectedMonth || item.month === selectedMonth)
                  )
                  .map((item, index) => (
                    <div key={`${item.year}-${item.month}`} className="rounded-xl border bg-gradient-to-br from-teal-50 to-white p-5 shadow-md hover:shadow-lg transition">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-teal-800">
                          {item.month} {item.year}
                        </h3>
                        <Badge variant={item.completedJobs > 0 ? 'default' : 'secondary'} className="text-xs px-2 py-1">
                          {item.totalJobs} {t('monthlyBalance.jobs') || 'jobs'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">
                            {t('monthlyBalance.completed') || 'Completed'}
                          </p>
                          <p className="text-lg font-semibold text-green-700">
                            {item.completedJobs}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">
                            {t('monthlyBalance.pending') || 'Pending'}
                          </p>
                          <p className="text-lg font-semibold text-orange-700">
                            {item.pendingJobs}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">
                            {t('monthlyBalance.earnings') || 'Earnings'}
                          </p>
                          <p className="text-lg font-semibold text-emerald-700">
                            {formatCurrency(item.totalEarnings)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500">
                            {t('monthlyBalance.hours') || 'Hours'}
                          </p>
                          <p className="text-lg font-semibold text-blue-700">
                            {formatHours(item.totalHours)}
                          </p>
                        </div>
                      </div>
                      {item.averageRating > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-xs text-gray-500">
                              {t('monthlyBalance.rating') || 'Rating'}:
                            </span>
                            <span className="text-sm font-semibold text-yellow-700">
                              {item.averageRating.toFixed(1)}/5
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default MonthlyBalancePage; 