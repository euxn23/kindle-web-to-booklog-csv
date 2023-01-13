/**
 * @param {} books
 * @param {'読みたい' | 'いま読んでる' | '読み終わった' | '積読 | ''} defaultStatus
 */
async function exportBooklogCSV(books, defaultStatus = '') {
  /**
   * @param   {[string, string, string, string, string, string, string, string, string, string][]} csv2dArray
   * @returns {string}
   */
  function csv2dArrayToText(csv2dArray) {
    return csv2dArray.map((csvArray) => csvArray.join(',')).join('\r\n');
  }

  /**
   * @param   {string} csvText
   * @returns {void}
   */
  function download(csvText) {
    const downloadUrl = URL.createObjectURL(
      new Blob([csvText], {
        type: 'text/csv',
      })
    );
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = 'booklog.csv';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  function convertBooksDataToCSV2dArray(books) {
    return books.map((book) => [
      /* ServiceID */   '1', //Amazon.co.jp ServiceID is 1
      /* ItemID */      book.asin,
      /* ISBN13 */      '',
      /* Category */    '-',
      /* Evaluation */  '',
      /* Status */      '',
      /* Review */      '',
      /* Tag */         '',
      /* Memo */        '',
      /* RegistDate */  '',
      /* FinishDate */  '',
    ]);
  }

  download(csv2dArrayToText(convertBooksDataToCSV2dArray(books)));
}

/**
 * @param   {'EBOOK' | 'COMICS' | undefined} resourceType
 * @param   {'acquisition_asc' | 'acquisition_desc' | 'title' | 'author' | 'recency'}
 */
async function fetchBooksViaKindleWeb({ resourceType, sortType } = {}) {
  /**
   * @param   {number} paginationToken
   */
  function buildUrl(paginationToken = 0) {
    // @note MAX query size seems to be 50
    return `https://read.amazon.co.jp/kindle-library/search?query=${
      resourceType ? `&resourceType=${resourceType}` : ''
    }${paginationToken ? `&paginationToken=${paginationToken}` : ''}&sortType=${
      sortType ?? 'acquisition_asc'
    }&querySize=50`;
  }

  /**
   * @param   {number} pagenationToken
   * @returns {Promise<{
   *            asin: string,
   *            authors: string[],
   *            mangaOrComicAsin: boolean,
   *            originType: string,
   *            percentageRead: number,
   *            productUrl: string,
   *            resourceType: string,
   *            title: string,
   *            webReaderUrl: string
   *          }>} books
   */
  async function fetchBooks(paginationToken) {
    const res = await fetch(buildUrl(paginationToken)).then((res) =>
      res.json()
    );
    if (res.paginationToken) {
      return [...res.itemsList, ...(await fetchBooks(res.paginationToken))];
    } else {
      return res.itemsList;
    }
  }

  return fetchBooks();
}

fetchBooksViaKindleWeb({ resourceType: 'EBOOK' }).then((books) => exportBooklogCSV(books));
