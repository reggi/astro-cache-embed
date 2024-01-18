export const isContentType = (response: Response, contentTypeRegex: RegExp): boolean => {
  const contentType = response.headers.get('content-type') || '';
  return contentTypeRegex.test(contentType);
};

export const isImage = (response: Response): boolean => {
  return isContentType(response, /^image\//);
};

export const isAudio = (response: Response): boolean => {
  return isContentType(response, /^audio\//);
};

export const isVideo = (response: Response): boolean => {
  return isContentType(response, /^video\//);
};

type ResponseChecker = (response: Response) => boolean;

export const compositeResponse = (...fns: ResponseChecker[]) => {
  return (response: Response) => {
    return fns.some(checker => checker(response));
  };
};
