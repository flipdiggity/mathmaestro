import { redirect } from 'next/navigation';

// "History" in the nav lives at /worksheets; redirect the intuitive /history URL.
export default function HistoryRedirect() {
  redirect('/worksheets');
}
