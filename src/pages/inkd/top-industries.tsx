import { useMemo, useState } from "react";
import { ArrowLeft, Sparkles, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/api/endpoints";
import apiInstance from "@/api/queryClient";
import { FullScreenLoader } from "@/components/full-screen-loader";
import IndustryInfiniteSelect from "@/components/commons/selects/industry-infinite-select";
import { useApiMutation } from "@/hooks/useApiMutation";
import { useApiQuery } from "@/hooks/useApiQuery";
import { appToast } from "@/utils/toast";

const MAX_TOP_INDUSTRIES = 20;

type IndustrySelectOption = {
  value: string;
  label: string;
  data?: {
    _id: string;
    name: string;
    description?: string | null;
  };
};

type TopIndustryEntry = {
  _id: string;
  name: string;
  description?: string | null;
  archivedAt?: string | null;
};

type TopIndustriesPayload = {
  maxIndustries: number;
  remainingSlots: number;
  industryIds: string[];
  entries: TopIndustryEntry[];
  total: number;
};

export default function InkDTopIndustriesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedIndustry, setSelectedIndustry] = useState<IndustrySelectOption | null>(null);
  const [pickerKey, setPickerKey] = useState(0);
  const [removingIndustryId, setRemovingIndustryId] = useState<string | null>(null);

  const listRoute = endpoints.entities.inkd.topIndustries.list;
  const listQueryKey = ["GET", listRoute] as const;
  const { data, isLoading, isFetching } = useApiQuery(listRoute);

  const payload = (data?.data?.data ?? null) as TopIndustriesPayload | null;
  const entries = Array.isArray(payload?.entries) ? payload.entries : [];
  const industryIds = Array.isArray(payload?.industryIds) ? payload.industryIds : [];
  const maxIndustries = payload?.maxIndustries ?? MAX_TOP_INDUSTRIES;
  const remainingSlots = payload?.remainingSlots ?? Math.max(0, maxIndustries - entries.length);
  const isAtLimit = entries.length >= maxIndustries;

  const excludeIds = useMemo(() => industryIds.join(","), [industryIds]);

  async function refreshListing() {
    await queryClient.invalidateQueries({ queryKey: listQueryKey });
  }

  const addMutation = useApiMutation<{ industryId: string }, any>({
    route: endpoints.entities.inkd.topIndustries.add,
    method: "POST",
    onSuccess: async () => {
      setSelectedIndustry(null);
      setPickerKey((value) => value + 1);
      appToast.success("Top industry added");
      await refreshListing();
    },
  });

  async function handleAddIndustry() {
    if (!selectedIndustry?.value) {
      appToast.error("Select an industry first");
      return;
    }

    await addMutation.mutateAsync({ industryId: selectedIndustry.value });
  }

  async function handleRemoveIndustry(industryId: string) {
    setRemovingIndustryId(industryId);
    try {
      await apiInstance.delete(endpoints.entities.inkd.topIndustries.remove(industryId));
      appToast.success("Top industry removed");
      await refreshListing();
    } catch (error: any) {
      appToast.error(error?.response?.data?.message ?? error?.message ?? "Failed to remove top industry");
    } finally {
      setRemovingIndustryId(null);
    }
  }

  if (isLoading && !payload) {
    return <FullScreenLoader />;
  }

  return (
    <div className="min-h-screen w-full bg-white px-4 pb-16 pt-4 md:px-6 xl:px-8 2xl:px-10">
      <div className="mx-auto w-full max-w-[1880px]">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/inkd")}
                className="flex h-[34px] w-[50px] items-center justify-center rounded-full border-b-2 border-b-white bg-[#ececec] text-[#2a2a2a]"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="rounded-full bg-[#ececec] px-4 py-2 text-[13px] uppercase tracking-[0.18em] text-[#5f5f68]">
                InkD top industries
              </div>
              {isFetching ? (
                <div className="rounded-full border border-[#d9dcf0] bg-[#f5f6ff] px-4 py-2 text-[12px] font-medium text-[#5d67bf]">
                  Refreshing...
                </div>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-[28px] border border-[#e7eaf2] bg-[linear-gradient(135deg,#e9edf8_0%,#eef2fb_58%,#e4e9f2_100%)] p-6 shadow-[0_10px_28px_rgba(17,24,39,0.06)] md:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#727DD5] shadow-sm">
                <Sparkles size={22} />
              </div>
              <p className="text-[13px] uppercase tracking-[0.22em] text-[#8a8a91]">
                Industry curation
              </p>
              <h1 className="mt-3 text-[30px] font-normal uppercase leading-[1.1] text-[#1a1a1d]">
                InkD Top Industries
              </h1>
              <p className="mt-4 max-w-[880px] text-[15px] leading-7 text-[#676b75]">
                Curate up to {maxIndustries} industries that should be treated as the highlighted InkD industry set. These industries are stored in the
                app config singleton and can be consumed by any common InkD experience.
              </p>
            </div>
          </div>

          <div className="flex w-full max-w-[460px] flex-col gap-4 rounded-[28px] border border-[#e7eaf2] bg-[#eef1f7] p-4 shadow-[0_10px_28px_rgba(17,24,39,0.06)]">
            <div className="rounded-[20px] bg-white p-4">
              <p className="text-[13px] uppercase tracking-[0.18em] text-[#8a8a91]">
                Capacity
              </p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[34px] leading-none text-[#202024]">
                    {entries.length}
                  </p>
                  <p className="mt-2 text-[13px] text-[#7e7e86]">
                    selected industries
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[22px] leading-none text-[#5d67bf]">
                    {remainingSlots}
                  </p>
                  <p className="mt-2 text-[13px] text-[#7e7e86]">
                    slots left
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[20px] bg-white p-4">
              <p className="text-[13px] uppercase tracking-[0.18em] text-[#8a8a91]">
                Add industry
              </p>
              <div className="mt-4 space-y-3">
                <IndustryInfiniteSelect
                  key={pickerKey}
                  route={endpoints.entities.industry.commonAdvancedListing}
                  placeholder={isAtLimit ? "Top industries limit reached" : "Search active industries..."}
                  queryParams={{ excludeIds }}
                  onChange={(option) => setSelectedIndustry(option as IndustrySelectOption | null)}
                  selectProps={{
                    isDisabled: isAtLimit || addMutation.isPending,
                  }}
                />

                <button
                  type="button"
                  onClick={handleAddIndustry}
                  disabled={!selectedIndustry || isAtLimit || addMutation.isPending}
                  className="flex h-[44px] w-full items-center justify-center rounded-full bg-[#727DD5] px-4 text-[15px] text-white transition-all duration-300 hover:bg-[#5765c2] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {addMutation.isPending ? "Adding..." : "Add industry"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#e7eaf2] bg-[#eef1f7] p-5 shadow-[0_10px_28px_rgba(17,24,39,0.06)] md:p-6">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[13px] uppercase tracking-[0.2em] text-[#8a8a91]">
                Current set
              </p>
              <h2 className="mt-2 text-[24px] text-[#202024]">
                Stored top industries
              </h2>
            </div>
            <div className="rounded-full bg-white px-4 py-2 text-[13px] text-[#6f6f78]">
              {entries.length} of {maxIndustries} configured
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-[20px] bg-white p-8 text-center text-[15px] text-[#7e7e86]">
              No top industries configured yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {entries.map((industry) => (
                <div
                  key={industry._id}
                  className="rounded-[20px] border border-[#e1e5ee] bg-white p-5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[12px] uppercase tracking-[0.18em] text-[#8a8a91]">
                        Industry
                      </p>
                      <h3 className="mt-2 break-words text-[20px] text-[#202024]">
                        {industry.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIndustry(industry._id)}
                      disabled={removingIndustryId === industry._id}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f6fb] text-[#6a6f86] transition hover:bg-[#eceffd] hover:text-[#4f58a8] disabled:cursor-not-allowed disabled:opacity-70"
                      title="Remove industry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {industry.archivedAt ? (
                    <div className="mt-4 inline-flex rounded-full border border-[#f0d6d6] bg-[#fff5f5] px-3 py-1 text-[12px] font-medium text-[#b05858]">
                      Archived
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-[18px] bg-[#f7f8fc] p-4">
                    <p className="text-[12px] uppercase tracking-[0.18em] text-[#8a8a91]">
                      Description
                    </p>
                    <p className="mt-3 text-[14px] leading-6 text-[#5d616b]">
                      {industry.description?.trim() ? industry.description : "No description available."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
