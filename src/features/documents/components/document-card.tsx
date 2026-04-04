'use client';

import { FileText, FileSpreadsheet, FileImage, File, MoreVertical, Download, Trash2, Edit } from 'lucide-react';
import { formatDate, formatFileSize } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/shared/status-badge';
import type { Document } from '@/lib/supabase/database.types';

const fileIcons: Record<string, typeof FileText> = {
  'application/pdf': FileText,
  'application/msword': FileText,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': FileText,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'image/png': FileImage,
  'image/jpeg': FileImage,
};

interface DocumentCardProps {
  document: Document;
  canEdit?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function DocumentCard({ document, canEdit = false, onEdit, onDelete }: DocumentCardProps) {
  const Icon = (document.file_type && fileIcons[document.file_type]) || File;

  return (
    <div className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium truncate">{document.title}</h3>
            {document.description && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                {document.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <StatusBadge status={document.category} />
            {canEdit && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Download
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatDate(document.created_at)}</span>
          {document.file_size_bytes && <span>{formatFileSize(document.file_size_bytes)}</span>}
        </div>
      </div>
    </div>
  );
}
