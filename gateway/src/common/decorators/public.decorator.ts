import { SetMetadata } from '@nestjs/common';
import { METADATA_KEYS } from '../constants/headers.constants';

export const IS_PUBLIC_KEY = METADATA_KEYS.IS_PUBLIC;
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
