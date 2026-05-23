import { useEffect } from 'react';

const DocumentTitle = ({ title, children }) => {
  useEffect(() => {
    document.title = title ? `${title} | Employee Management System` : 'Employee Management System';
  }, [title]);

  return children || null;
};

export default DocumentTitle;
