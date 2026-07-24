import { SetMetadata } from '@nestjs/common';
import { METADATA_KEYS } from '../constants/headers.constants';

export const REQUIRE_API_KEY_KEY = METADATA_KEYS.REQUIRE_API_KEY;
export const RequireApiKey = () => SetMetadata(REQUIRE_API_KEY_KEY, true);
