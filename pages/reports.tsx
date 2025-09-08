import ReportsPage from '@/components/screens/reportsPage';
import { withPageAuth } from '@/lib/withPageAuth';

export const getServerSideProps = withPageAuth(['admin']);
export default ReportsPage;
