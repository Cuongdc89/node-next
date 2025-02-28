import Table from '@/app/ui/customers/table';
import { Suspense } from 'react';
import { fetchFilteredCustomers, fetchFilteredCustomersPage } from '@/app/lib/data';
import { CustomerTableSkeleton } from '@/app/ui/skeletons';
import Pagination from '@/app/ui/customers/pagination';

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query        = searchParams?.query || '';
  const currentPage  = Number(searchParams?.page || 1);
  const customers = await fetchFilteredCustomers(query, currentPage);
  const totalPages   = await fetchFilteredCustomersPage(query);
  
  return (
      <div className="w-full">
          <Suspense fallback={<CustomerTableSkeleton />}>
          <Table customers = {customers}/>
        </Suspense>
        <div className="mt-5 flex w-full justify-center">
          <Pagination totalPages={totalPages} />
        </div>
      </div>
      
    );
  }