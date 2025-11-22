'use client';

import React from 'react';
import { DriversSimpleTable } from '@/components/admin/DriversSimpleTable';
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import withAuth from '@/components/auth/withAuth';

function DriversPage() {
  return (
    <ResponsiveContainer maxWidth="full" padding="none">
      <div className="space-y-4 sm:space-y-6">
        {/* Content */}
        <div className="section-padding px-3 sm:px-4 md:px-6">
          <DriversSimpleTable />
        </div>
      </div>
    </ResponsiveContainer>
  );
}

export default withAuth(DriversPage, {
  requiredRoles: ['ADMIN', 'SUPER_ADMIN', 'CONTADORA'],
});
