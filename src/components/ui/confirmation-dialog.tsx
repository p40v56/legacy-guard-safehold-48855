import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  onConfirm: () => void;
  onCancel?: () => void;
}

const ConfirmationDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const getIcon = () => {
    switch (variant) {
      case 'destructive':
        return <XCircle className="w-6 h-6 text-destructive" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-success" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-warning" />;
      default:
        return <Info className="w-6 h-6 text-primary" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'destructive':
        return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
      case 'success':
        return "bg-success hover:bg-success/90 text-success-foreground";
      case 'warning':
        return "bg-warning hover:bg-warning/90 text-warning-foreground";
      default:
        return "bg-primary hover:bg-primary/90 text-primary-foreground";
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-card-foreground flex items-center gap-3">
            {getIcon()}
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={handleCancel}
            className="bg-muted border-border text-foreground hover:bg-muted/80"
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            className={getConfirmButtonClass()}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { ConfirmationDialog };