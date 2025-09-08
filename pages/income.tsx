import { withPageAuth } from '@/lib/withPageAuth';
import IncomeAndExpenses from '@/components/screens/incomePage';

export const getServerSideProps = withPageAuth(['admin', 'user']);
export default IncomeAndExpenses;
