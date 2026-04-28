/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';
import { FileText, Loader2, Sparkles, Copy, Check, Presentation, UploadCloud, X } from 'lucide-react';
import * as mammoth from 'mammoth';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [documentText, setDocumentText] = useState('');
  const [fileName, setFileName] = useState('');
  const [generatedSlides, setGeneratedSlides] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      setError('Vui lòng tải lên tệp định dạng .docx');
      return;
    }

    setIsUploading(true);
    setError('');
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setDocumentText(result.value);
    } catch (err) {
      console.error('Lỗi khi đọc file docx:', err);
      setError('Không thể đọc nội dung tệp .docx. Vui lòng thử lại.');
      setFileName('');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearFile = () => {
    setFileName('');
    setDocumentText('');
    setError('');
  };

  const handleGenerate = async () => {
    if (!documentText.trim()) {
      setError('Vui lòng nhập nội dung hoặc tải lên tài liệu của bạn.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setGeneratedSlides('');

    try {
      const systemInstruction = `Bạn là một chuyên gia thiết kế bài giảng xuất sắc với hơn 10 năm kinh nghiệm. Nhiệm vụ của bạn là soạn thảo nội dung cho một bộ Slide linh hoạt từ 15 đến 20 slide tùy thuộc vào độ dài và chi tiết của tài liệu (đặc biệt là giáo án) được cung cấp.

Yêu cầu về cấu trúc mỗi slide bao gồm:
- **Tiêu đề Slide:** BẮT BUỘC giữ y nguyên 100% các tiêu đề mục lục từ tài liệu gốc (bao gồm cả số thứ tự I, II, 1, 2, 1.1... và các tiền tố như "Biện pháp 1:", "Phần 1:", "Chương 1:"...) để làm tên cho các slide nội dung tương ứng. Ví dụ: Nếu tài liệu ghi "2.1. Biện pháp 1: Thiết lập 'Hệ sinh thái số' trong quản lý lớp", bạn phải lấy chính xác toàn bộ câu đó làm tiêu đề slide, không được tự ý rút gọn hay bỏ bớt từ nào. Với các slide mở đầu/kết thúc không thuộc mục lục, hãy đặt tiêu đề ngắn gọn, gây tò mò.
- **Nội dung chính (Nguyên tắc 7x7):** Tối đa 3-4 ý đầu dòng, mỗi ý không quá 15 chữ. Tuyệt đối KHÔNG viết câu dài, hãy tập trung chắt lọc các "Từ khóa đắt giá" (Keywords) mang tính cốt lõi. CẤM TUYỆT ĐỐI tự sáng tạo, bịa đặt hoặc thêm thắt các ý không có trong tài liệu gốc. Mọi nội dung, ý tưởng phải bám sát 100% thông tin từ file được tải lên. ĐẶC BIỆT LƯU Ý: Đối với các tài liệu dạng giáo án có chia theo các "Hoạt động", BẮT BUỘC phải trích xuất bám sát và ĐẦY ĐỦ nội dung từ cột/phần "Dự kiến sản phẩm" (hoặc "Sản phẩm") của từng hoạt động để đưa lên slide tương ứng. LƯU Ý TUYỆT ĐỐI: Nếu trong phần "Dự kiến sản phẩm" có các danh sách câu hỏi, câu trả lời, trò chơi, từ khóa (ví dụ: Câu 1, Câu 2, các gợi ý...), bạn BẮT BUỘC phải đưa đầy đủ các câu hỏi/nội dung đó vào slide, không được tóm tắt làm mất nội dung chi tiết của các câu hỏi này. Hãy phân bổ số lượng slide sao cho phù hợp để chứa hết các nội dung này mà không bị quá tải chữ trên một slide. Sử dụng ngôn ngữ sư phạm tinh tế, dễ hiểu.
- **Gợi ý hình ảnh/Nền (Visual Thinking):** Mô tả chi tiết bối cảnh, phong cách hình ảnh hoặc màu sắc nền phù hợp. Ví dụ: Thay vì "Hình ảnh trái đất", hãy viết "Hình ảnh 3D Trái đất nhìn từ không gian với ánh sáng xanh tối giản để làm nổi bật thông điệp". Điều này giúp slide đẳng cấp và trực quan hơn.
- **Ghi chú giảng viên (Teacher's Note - Tính kết nối):** Viết một câu dẫn dắt mượt mà, tạo sự liên kết chặt chẽ và logic với slide tiếp theo hoặc slide trước đó, giúp bài giảng liền mạch, không bị ngắt quãng.

Cấu trúc bộ Slide cần tuân thủ (Tổng số 15-20 slide):
- Slide 1: Tiêu đề ấn tượng & Tên môn học.
- Slide 2: Mục tiêu bài học (Dưới dạng 'Sau bài này bạn sẽ làm được gì?').
- Slide 3: Tình huống thực tế hoặc câu hỏi gợi mở (Hook).
- Slide 4 đến (N-3): Triển khai các nội dung chính từ file tài liệu (Phân tích sâu, có ví dụ). Đảm bảo tiêu đề slide giữ y nguyên toàn bộ text của các mục (bao gồm cả số thứ tự và các từ như "Biện pháp 1:", "Phần 1:"...) từ tài liệu gốc. ĐẶC BIỆT: Đối với phần "Hoạt động hình thành kiến thức" (hoặc "Hoạt động 2: trải nghiệm - hình thành kiến thức"), BẮT BUỘC phải tạo ít nhất 5 slide chi tiết để trình bày sâu và đầy đủ nội dung kiến thức của phần này. Hãy linh hoạt phân bổ nội dung (đặc biệt là phần "Dự kiến sản phẩm" và các câu hỏi chi tiết) ra nhiều slide nếu cần thiết để đảm bảo không bị quá tải chữ trên một slide.
- Slide (N-2): Hoạt động tương tác hoặc câu hỏi ôn tập nhanh.
- Slide (N-1): Tổng kết bài học bằng một sơ đồ tư duy tóm tắt.
- Slide N (Slide cuối): Thông điệp truyền cảm hứng & Lời kết.
(N là tổng số slide bạn quyết định tạo, từ 15 đến 20).

Phong cách ngôn ngữ: Chuyên nghiệp, truyền cảm hứng, phù hợp với môi trường giáo dục hiện đại. Hãy trình bày dưới dạng Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Tài liệu:\n\n${documentText}`,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      setGeneratedSlides(response.text || 'Không thể tạo nội dung. Vui lòng thử lại.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra lỗi khi tạo slide.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSlides);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center space-y-4 pt-8 pb-4">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-2xl mb-2 shadow-sm">
            <Presentation className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Slide Deck Generator
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tải lên tệp Word (.docx) hoặc dán nội dung tài liệu của bạn vào bên dưới, AI sẽ tự động thiết kế một bộ slide bài giảng chuyên nghiệp gồm 15 slide theo cấu trúc chuẩn sư phạm.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-semibold">Tài liệu đầu vào</h2>
              </div>
              
              <div>
                <input 
                  type="file" 
                  accept=".docx" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isGenerating}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors border border-indigo-100"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  Tải lên .docx
                </button>
              </div>
            </div>

            {fileName && (
              <div className="flex items-center justify-between p-3 mb-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 overflow-hidden">
                  <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700 truncate">{fileName}</span>
                </div>
                <button 
                  onClick={clearFile}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa tệp"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <textarea
              className="flex-1 w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none text-base leading-relaxed"
              placeholder={fileName ? "Nội dung đã được trích xuất từ tệp. Bạn có thể chỉnh sửa thêm tại đây..." : "Dán nội dung tài liệu, bài viết, hoặc tải lên tệp .docx..."}
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
            />
            {error && <p className="text-red-500 text-sm mt-3 px-2">{error}</p>}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !documentText.trim()}
              className="mt-6 w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-2xl font-medium text-lg flex items-center justify-center gap-3 transition-colors shadow-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Đang thiết kế bài giảng...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  Tạo Slide Bài Giảng
                </>
              )}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold">Kết quả (Markdown)</h2>
              </div>
              {generatedSlides && (
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200 hover:border-indigo-200"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Đã sao chép' : 'Sao chép'}
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-2xl p-6 border border-slate-200">
              {generatedSlides ? (
                <div className="prose prose-slate prose-indigo max-w-none prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-slate-600 prose-li:text-slate-600">
                  <Markdown>{generatedSlides}</Markdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                  <Presentation className="w-16 h-16 opacity-20" />
                  <p className="text-lg">Bản thảo slide sẽ xuất hiện ở đây</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
