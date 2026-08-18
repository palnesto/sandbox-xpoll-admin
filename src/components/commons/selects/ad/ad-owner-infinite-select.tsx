import React from "react";
import Select from "react-select";
import InfiniteSelect from "@/components/commons/selects/base/infinite-select";
import { endpoints } from "@/api/endpoints";

type AdOwnerItem = {
  _id: string;
  name: string;
  description?: string | null;
  archivedAt?: string | null;
};

type BaseOption<T = unknown> = { value: string; label: string; data?: T };

type Props = {
  onChange?: (opt: BaseOption<AdOwnerItem> | null) => void;
  placeholder?: string;
  pageSize?: number;
  minChars?: number;
  debounceMs?: number;

  /**
   * ✅ Pass API query params directly (except "name" which is set from search).
   * Example:
   *  queryParams={{ includeArchived: false, excludeIds: "id1,id2" }}
   */
  queryParams?: Record<string, unknown>;

  /**
   * ✅ If you need query params to depend on `search`, use this.
   * If provided, it wins over `queryParams`.
   */
  getQueryParams?: (search: string) => Record<string, unknown>;

  selectProps?: Partial<
    React.ComponentProps<typeof Select<BaseOption<AdOwnerItem>>>
  >;
};

export default function AdOwnerInfiniteSelect({
  onChange,
  placeholder = "Search ad owners...",
  pageSize = 50,
  minChars = 0,
  debounceMs = 300,
  queryParams,
  getQueryParams,
  selectProps,
}: Props) {
  return (
    <InfiniteSelect<AdOwnerItem, Record<string, unknown>>
      route={endpoints.entities.ad.adOwners.advancedListing}
      pageSize={pageSize}
      debounceMs={debounceMs}
      minChars={minChars}
      fetchTrigger="open"
      getFilters={(search) => {
        // Caller fully controls params if they want
        const base = getQueryParams
          ? getQueryParams(search)
          : { ...(queryParams ?? {}) };

        // Standard search behavior for this select: search is mapped to `name`
        const s = search?.trim();
        if (s) (base as any).name = s;
        else delete (base as any).name;

        return base as Record<string, unknown>;
      }}
      mapItemToOption={(item) => ({
        value: item._id,
        label: item.name,
        data: item,
      })}
      onChange={onChange as any}
      placeholder={placeholder}
      selectProps={{
        ...selectProps,
        menuPortalTarget: selectProps?.menuPortalTarget ?? document.body,
      }}
    />
  );
}
