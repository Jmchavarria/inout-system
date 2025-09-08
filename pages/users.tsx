import { withPageAuth } from '@/lib/withPageAuth';
import UsersPage from '@/components/screens/usersPage';

export const getServerSideProps = withPageAuth(['admin']);
export default UsersPage;
