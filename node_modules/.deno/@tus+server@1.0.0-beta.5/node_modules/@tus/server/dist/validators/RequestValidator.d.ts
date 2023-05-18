export declare const RequestValidator: {
    _invalidUploadOffsetHeader(value: string | undefined): boolean;
    _invalidUploadLengthHeader(value: string | undefined): boolean;
    _invalidUploadDeferLengthHeader(value: string | undefined): boolean;
    _invalidUploadMetadataHeader(value: string): boolean;
    _invalidXRequestedWithHeader(): boolean;
    _invalidXForwardedHostHeader(): boolean;
    _invalidXForwardedProtoHeader(value: string): boolean;
    _invalidTusVersionHeader(value: string): boolean;
    _invalidTusResumableHeader(value: string): boolean;
    _invalidTusExtensionHeader(): boolean;
    _invalidTusMaxSizeHeader(): boolean;
    _invalidXHttpMethodOverrideHeader(): boolean;
    _invalidContentTypeHeader(value: string | undefined): boolean;
    _invalidAuthorizationHeader(): boolean;
    _invalidUploadConcatHeader(value: string): boolean;
    capitalizeHeader(header_name: string): string;
    isInvalidHeader(header_name: string, header_value: string | undefined): boolean;
};
