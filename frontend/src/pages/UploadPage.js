import CSVUpload from '../components/CSVUpload';

export default function UploadPage() {
  return (
    <div style={{ maxWidth: 800, margin: '2rem auto' }}>
      <h1>Upload Tasks CSV/XLSX</h1>
      <CSVUpload />
    </div>
  );
}
