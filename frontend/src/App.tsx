import React, { useEffect, useState } from 'react';
import { useStore, type ReceiptItem } from './store/useStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { UploadCloud, CheckCircle, PackageSearch, RefreshCw } from 'lucide-react';

function App() {
  const { receipts, comparisons, fetchReceipts, fetchComparisons, scanReceipt, addReceipt, deleteReceipt, fetchExchangeRate } = useStore();
  
  const [isScanning, setIsScanning] = useState(false);
  const [view, setView] = useState<'DASHBOARD' | 'COMPARE'>('DASHBOARD');

  // 실거래 환율 상태 (USD 기준)
  const [usdToLak, setUsdToLak] = useState(23000); // 1 USD = 23,000 LAK
  const [usdToThb, setUsdToThb] = useState(35);    // 1 USD = 35 THB
  const [usdToKrw, setUsdToKrw] = useState(1350);  // 1 USD = 1,350 KRW (네이버 연동)

  useEffect(() => {
    fetchReceipts();
    fetchComparisons();
    // 네이버 고시환율 불러오기
    fetchExchangeRate().then(rate => {
      if (rate) setUsdToKrw(rate);
    }).catch(console.error);
  }, []);

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsScanning(true);
      let successCount = 0;

      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i];
          const data = await scanReceipt(file);
          await addReceipt(data.storeName || '알 수 없는 상점', data.date || new Date().toISOString(), data.totalAmount || 0, data.currency || 'LAK', data.items || []);
          successCount++;
        } catch (err) {
          console.error(`Failed to scan file ${i + 1}:`, err);
        }
      }

      await fetchReceipts();
      await fetchComparisons();
      alert(`총 ${files.length}장 중 ${successCount}개의 영수증이 성공적으로 자동 입력되었습니다!`);
    } catch (error) {
      alert('영수증 인식 중 오류가 발생했습니다.');
      console.error(error);
    } finally {
      setIsScanning(false);
      e.target.value = '';
    }
  };

  // 통화에 따른 달러 변환 함수
  const getUsd = (amount: number, currency: string) => {
    if (currency === 'THB') return amount / (usdToThb || 1);
    return amount / (usdToLak || 1); // 기본 LAK
  };
  
  const getKrw = (amount: number, currency: string) => {
    return getUsd(amount, currency) * (usdToKrw || 1);
  };

  const totalSpentUsd = receipts.reduce((acc, r) => acc + getUsd(r.totalAmount, r.currency), 0);
  const totalSpentKrw = totalSpentUsd * (usdToKrw || 1);
  
  const totalItemsCount = receipts.reduce((acc, r) => acc + r.items.length, 0);

  // 상점별 지출 합계 (차트용 데이터 - 원화 기준 통일)
  const storeDataMap: Record<string, number> = {};
  receipts.forEach(r => {
    storeDataMap[r.storeName] = (storeDataMap[r.storeName] || 0) + getKrw(r.totalAmount, r.currency);
  });
  const chartData = Object.keys(storeDataMap).map(key => ({ name: key, amount: Math.round(storeDataMap[key]) }));

  return (
    <div className="min-h-screen bg-teal-50 p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* 헤더 및 탭 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-xl shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold text-teal-800 mb-4">📊 스마트 가계부</h1>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => setView('DASHBOARD')} className={`px-4 py-2 font-bold rounded-lg ${view === 'DASHBOARD' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'}`}>일별 리포트</button>
              <button onClick={() => setView('COMPARE')} className={`px-4 py-2 font-bold rounded-lg ${view === 'COMPARE' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'}`}>상점별 가격 비교</button>
              <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 transition-all">
                {isScanning ? '⏳ 영수증 인식 중...' : <><UploadCloud size={20} /> 다중 영수증 업로드</>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleScanReceipt} disabled={isScanning} />
              </label>
            </div>
          </div>
          
          {/* 환율 설정 패널 */}
          <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 text-sm shadow-inner min-w-[250px]">
            <h3 className="font-bold text-teal-900 mb-3 flex items-center gap-1"><RefreshCw size={14}/> 적용 중인 환율 (USD-KRW 네이버 연동)</h3>
            <div className="flex flex-col gap-2 text-gray-700">
              <label className="flex items-center justify-between">
                <span className="font-semibold">1 USD = </span>
                <div className="flex items-center gap-1">
                  <input type="number" value={usdToLak} onChange={e => setUsdToLak(Number(e.target.value) || 0)} className="border p-1 w-24 rounded text-right" /> ₭
                </div>
              </label>
              <label className="flex items-center justify-between">
                <span className="font-semibold">1 USD = </span>
                <div className="flex items-center gap-1">
                  <input type="number" value={usdToThb} onChange={e => setUsdToThb(Number(e.target.value) || 0)} className="border p-1 w-24 rounded text-right" /> ฿(바트)
                </div>
              </label>
              <label className="flex items-center justify-between">
                <span className="font-semibold">1 USD = </span>
                <div className="flex items-center gap-1">
                  <input type="number" value={usdToKrw} onChange={e => setUsdToKrw(Number(e.target.value) || 0)} className="border p-1 w-24 rounded text-right" /> 원
                </div>
              </label>
            </div>
          </div>
        </div>

        {view === 'DASHBOARD' && (
          <>
            {/* 요약 카드 영역 (중간) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-600 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center h-36">
                <p className="text-lg font-semibold opacity-90">총 지출액 (원화 환산)</p>
                <p className="text-3xl font-bold mt-2">{Math.round(totalSpentKrw).toLocaleString()} 원</p>
                <div className="text-sm font-medium opacity-80 mt-2 bg-blue-700/50 px-3 py-1 rounded-full">
                  ≈ ${totalSpentUsd.toFixed(2)}
                </div>
              </div>
              <div className="bg-indigo-500 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center h-36">
                <p className="text-lg font-semibold opacity-90">등록된 영수증 수</p>
                <p className="text-3xl font-bold mt-2">{receipts.length} 건</p>
              </div>
              <div className="bg-cyan-500 text-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center h-36">
                <p className="text-lg font-semibold opacity-90">등록된 상품 수</p>
                <p className="text-3xl font-bold mt-2">{totalItemsCount} 개</p>
              </div>
            </div>

            {/* 차트 영역 */}
            <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
              <h2 className="text-center text-xl font-bold text-gray-800 mb-6">상점별 총 지출 비용 (원화 기준 통합)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => `${value.toLocaleString()} 원`} />
                    <Bar dataKey="amount" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 데이터 테이블 (하단) */}
            <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
              <div className="bg-blue-800 text-white py-4 px-6 font-bold flex justify-between items-center">
                <span>일별 영수증 상세 내역</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-blue-50 text-blue-900 border-b">
                    <tr>
                      <th className="p-4 text-center">번호</th>
                      <th className="p-4">상점명</th>
                      <th className="p-4">일자</th>
                      <th className="p-4">구매 상품 내역</th>
                      <th className="p-4 text-right">총액 (원화 환산)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r, idx) => (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 text-center text-gray-500">{idx + 1}</td>
                        <td className="p-4 font-semibold text-gray-800">{r.storeName}</td>
                        <td className="p-4 text-gray-600">{new Date(r.date).toLocaleDateString()}</td>
                        <td className="p-4 text-gray-600">
                          <ul className="list-disc list-inside space-y-1">
                            {r.items.map(item => (
                              <li key={item.id}>
                                {item.name} <span className="text-xs text-gray-400">({item.price.toLocaleString()}{r.currency === 'THB' ? '฿' : '₭'} x {item.quantity})</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="p-4 text-right">
                          <p className="font-bold text-red-600">{r.totalAmount.toLocaleString()} {r.currency === 'THB' ? '฿' : '₭'}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            ≈ ${getUsd(r.totalAmount, r.currency).toFixed(2)}<br/>
                            ({Math.round(getKrw(r.totalAmount, r.currency)).toLocaleString()} 원)
                          </p>
                          <button onClick={async () => {
                            if (window.confirm('이 영수증을 삭제하시겠습니까?')) {
                              await deleteReceipt(r.id);
                              fetchComparisons();
                            }
                          }} className="mt-2 text-xs text-red-500 hover:text-red-700 underline">삭제</button>
                        </td>
                      </tr>
                    ))}
                    {receipts.length === 0 && (
                      <tr><td colSpan={5} className="p-12 text-center text-gray-500 text-lg">영수증 내역이 없습니다. 사진을 업로드해주세요.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {view === 'COMPARE' && (
          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
            <div className="bg-teal-800 text-white py-4 px-6 font-bold flex justify-between items-center">
              <span className="flex items-center gap-2"><PackageSearch size={20} /> 상점별 최저가 상품 한눈에 보기</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-teal-50 text-teal-900 border-b">
                  <tr>
                    <th className="p-4 whitespace-nowrap">상품명</th>
                    <th className="p-4 whitespace-nowrap">최저가 상점</th>
                    <th className="p-4 text-right whitespace-nowrap">최저가</th>
                    <th className="p-4">다른 상점 가격</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(comparisons).length === 0 ? (
                    <tr><td colSpan={4} className="p-12 text-center text-gray-500 text-lg">분석된 상품이 없습니다.</td></tr>
                  ) : (
                    Object.keys(comparisons).map(productName => {
                      const productList = comparisons[productName];
                      
                      // 최저가 비교는 원화로 환산하여 정렬
                      const sorted = [...productList].sort((a, b) => {
                        const aKrw = getKrw(a.price, a.currency || 'LAK');
                        const bKrw = getKrw(b.price, b.currency || 'LAK');
                        return aKrw - bKrw;
                      });

                      const lowest = sorted[0];
                      const others = sorted.slice(1);
                      const lowestCurrency = lowest.currency || 'LAK';
                      const lowestSymbol = lowestCurrency === 'THB' ? '฿' : '₭';

                      return (
                        <tr key={productName} className="border-b hover:bg-gray-50">
                          <td className="p-4 font-bold text-gray-800">{productName}</td>
                          <td className="p-4">
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1 w-max">
                              <CheckCircle size={14} /> {lowest.storeName}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <p className="font-bold text-green-700 text-lg">{lowest.price.toLocaleString()} {lowestSymbol}</p>
                            <p className="text-xs text-gray-500 font-medium">({Math.round(getKrw(lowest.price, lowestCurrency)).toLocaleString()} 원)</p>
                          </td>
                          <td className="p-4 text-gray-600 text-xs">
                            {others.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {others.map((item, idx) => {
                                  const c = item.currency || 'LAK';
                                  const sym = c === 'THB' ? '฿' : '₭';
                                  return (
                                    <span key={idx} className="bg-gray-100 border px-2 py-1 rounded">
                                      <span className="font-semibold">{item.storeName}</span>: {item.price.toLocaleString()}{sym} 
                                      <span className="text-gray-400 ml-1">({Math.round(getKrw(item.price, c)).toLocaleString()}원)</span>
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">비교 대상 없음</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
