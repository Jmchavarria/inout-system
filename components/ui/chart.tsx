import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import type { Payload as LegendPayload } from 'recharts/types/component/DefaultLegendContent';

import { cn } from '@/lib/utils';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >['children'];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'Chart';

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  );

  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`
          )
          .join('\n'),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

// ── Helpers ─────────────────────────────────────────────────
const toNode = (v: unknown): React.ReactNode =>
  v === null || v === undefined
    ? null
    : typeof v === 'string' || typeof v === 'number'
      ? v
      : (v as React.ReactNode);

const getItemKey = (
  item: Record<string, unknown>,
  override?: string
): string => {
  if (override) return String(override);
  const name = (item as Record<string, unknown>).name;
  const dataKey = (item as Record<string, unknown>).dataKey;
  return String((dataKey ?? name ?? 'value') as string);
};

const pickLabelValue = (
  cfgLabel: React.ReactNode | undefined,
  label: unknown,
  config: ChartConfig,
  labelKey?: string
): React.ReactNode | null => {
  if (!labelKey && typeof label === 'string') {
    const fromCfg = config[label as keyof typeof config]?.label;
    return toNode(fromCfg ?? label);
  }
  return toNode(cfgLabel);
};

const applyLabelFormatter = (
  val: React.ReactNode | null,
  payload: unknown[] | undefined,
  formatter:
    | ((value: unknown, payload: unknown[]) => React.ReactNode)
    | undefined,
  cls?: string
): React.ReactNode => {
  if (formatter) {
    return (
      <div className={cn('font-medium', cls)}>
        {formatter(val, payload ?? [])}
      </div>
    );
  }
  if (val === null || val === undefined) return null;
  return <div className={cn('font-medium', cls)}>{val}</div>;
};

const getIndicatorColor = (
  item: Record<string, unknown>,
  override?: string
): string | undefined => {
  if (override) return override;
  const p = (item.payload as Record<string, unknown>) || {};
  return (p.fill as string) || (item.color as string) || undefined;
};

const hasNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

function getTooltipLabel(
  hideLabel: boolean,
  payload: unknown[] | undefined,
  label: unknown,
  labelFormatter:
    | ((value: unknown, payload: unknown[]) => React.ReactNode)
    | undefined,
  labelClassName: string | undefined,
  config: ChartConfig,
  labelKey: string | undefined
): React.ReactNode {
  if (hideLabel || !payload?.length) return null;

  const item = payload[0] as Record<string, unknown>;
  const key = getItemKey(item, labelKey);
  const itemConfig = getPayloadConfigFromPayload(config, item, key);
  const value = pickLabelValue(itemConfig?.label, label, config, labelKey);

  return applyLabelFormatter(value, payload, labelFormatter, labelClassName);
}

const wrapTooltipItem = (
  key: string | number,
  indicator: 'line' | 'dot' | 'dashed',
  child: React.ReactNode
) => (
  <div
    key={String(key)}
    className={cn(
      'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
      indicator === 'dot' && 'items-center'
    )}
  >
    {child}
  </div>
);

const ValueNode = ({ value }: { value: unknown }) => {
  if (!hasNumber(value)) return null;
  return (
    <span className='font-mono font-medium tabular-nums text-foreground'>
      {value.toLocaleString()}
    </span>
  );
};

const LabelBlock = ({
  nestLabel,
  tooltipLabel,
  itemConfig,
  item,
}: {
  nestLabel: boolean;
  tooltipLabel: React.ReactNode;
  itemConfig?: { label?: React.ReactNode };
  item: Record<string, unknown>;
}) => (
  <div className='grid gap-1.5'>
    {nestLabel ? tooltipLabel : null}
    <span className='text-muted-foreground'>
      {toNode(itemConfig?.label) ?? toNode(item.name)}
    </span>
  </div>
);

const defaultItemContent = (
  itemConfig:
    | { label?: React.ReactNode; icon?: React.ComponentType }
    | undefined,
  hideIndicator: boolean,
  indicator: 'line' | 'dot' | 'dashed',
  indicatorColor: string | undefined,
  nestLabel: boolean,
  tooltipLabel: React.ReactNode,
  item: Record<string, unknown>
) => (
  <>
    {renderIndicator(
      itemConfig,
      hideIndicator,
      indicator,
      indicatorColor,
      nestLabel
    )}
    <div
      className={cn(
        'flex flex-1 justify-between leading-none',
        nestLabel ? 'items-end' : 'items-center'
      )}
    >
      <LabelBlock
        nestLabel={nestLabel}
        tooltipLabel={tooltipLabel}
        itemConfig={itemConfig}
        item={item}
      />
      <ValueNode value={(item as { value?: unknown }).value} />
    </div>
  </>
);

// Helper function to render tooltip item
function renderTooltipItem(
  item: Record<string, unknown>,
  index: number,
  config: ChartConfig,
  nameKey: string | undefined,
  hideIndicator: boolean,
  indicator: 'line' | 'dot' | 'dashed',
  color: string | undefined,
  formatter:
    | ((
        value: unknown,
        name: unknown,
        item: unknown,
        index: number,
        payload: unknown
      ) => React.ReactNode)
    | undefined,
  nestLabel: boolean,
  tooltipLabel: React.ReactNode
): React.ReactNode {
  const key = getItemKey(item, nameKey);
  const itemConfig = getPayloadConfigFromPayload(config, item, key);
  const indicatorColor = getIndicatorColor(item, color);

  if (formatter && 'value' in item && 'name' in item) {
    const content = formatter(
      (item as { value?: unknown }).value,
      (item as { name?: unknown }).name,
      item,
      index,
      (item as { payload?: unknown }).payload
    );
    return wrapTooltipItem(
      (item.dataKey as string) ?? index,
      indicator,
      content
    );
  }

  const content = defaultItemContent(
    itemConfig,
    hideIndicator,
    indicator,
    indicatorColor,
    nestLabel,
    tooltipLabel,
    item
  );

  return wrapTooltipItem((item.dataKey as string) ?? index, indicator, content);
}

// Helper function to render indicator
function renderIndicator(
  itemConfig: { icon?: React.ComponentType } | undefined,
  hideIndicator: boolean,
  indicator: 'line' | 'dot' | 'dashed',
  indicatorColor: unknown,
  nestLabel: boolean
): React.ReactNode {
  if (itemConfig?.icon) return <itemConfig.icon />;
  if (hideIndicator) return null;

  return (
    <div
      className={cn(
        'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]',
        {
          'h-2.5 w-2.5': indicator === 'dot',
          'w-1': indicator === 'line',
          'w-0 border-[1.5px] border-dashed bg-transparent':
            indicator === 'dashed',
          'my-0.5': nestLabel && indicator === 'dashed',
        }
      )}
      style={
        {
          '--color-bg': indicatorColor,
          '--color-border': indicatorColor,
        } as React.CSSProperties
      }
    />
  );
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<'div'> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: 'line' | 'dot' | 'dashed';
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    // Adaptador para labelFormatter de Recharts
    const normalizedLabelFormatter = React.useMemo<
      ((value: unknown, payload: unknown[]) => React.ReactNode) | undefined
    >(() => {
      if (!labelFormatter) return undefined;
      return (value, payloadArr) =>
        (labelFormatter as (label: any, payload: any[]) => React.ReactNode)(
          value as any,
          (payloadArr ?? []) as any[]
        );
    }, [labelFormatter]);

    // Adaptador para formatter de Recharts
    const normalizedFormatter = React.useMemo<
      | ((
          value: unknown,
          name: unknown,
          item: unknown,
          index: number,
          payload: unknown
        ) => React.ReactNode)
      | undefined
    >(() => {
      if (!formatter) return undefined;
      return (value, name, item, index, payload) =>
        (formatter as (
          v: any,
          n: any,
          i: any,
          idx: number,
          p: any
        ) => React.ReactNode)(
          value as any,
          name as any,
          item as any,
          index,
          payload as any
        );
    }, [formatter]);

    const tooltipLabel = React.useMemo(() => {
      return getTooltipLabel(
        hideLabel,
        payload as unknown[],
        label,
        normalizedLabelFormatter,
        labelClassName,
        config,
        labelKey
      );
    }, [
      label,
      normalizedLabelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ]);

    if (!active || !payload?.length) return null;

    const nestLabel = payload.length === 1 && indicator !== 'dot';

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className='grid gap-1.5'>
          {payload.map((item, index) =>
            renderTooltipItem(
              item as Record<string, unknown>,
              index,
              config,
              nameKey,
              hideIndicator,
              indicator,
              color,
              normalizedFormatter,
              nestLabel,
              tooltipLabel
            )
          )}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = 'ChartTooltip';

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> &
    Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = 'bottom', nameKey },
    ref
  ) => {
    const { config } = useChart();

    if (!payload?.length) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center gap-4',
          verticalAlign === 'top' ? 'pb-3' : 'pt-3',
          className
        )}
      >
        {payload.map((item) => {
          const lp = item as LegendPayload; // ✅ tipado correcto para Legend
          const key = `${nameKey || lp.dataKey || 'value'}`;
          const itemConfig = getPayloadConfigFromPayload(config, lp, key);

          return (
            <div
              key={String(lp.value)}
              className={cn(
                'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground'
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className='h-2 w-2 shrink-0 rounded-[2px]'
                  style={{ backgroundColor: lp.color as string }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegendContent.displayName = 'ChartLegend';

// Helper to extract item config from a payload
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
): { label?: React.ReactNode; icon?: React.ComponentType } | undefined {
  if (typeof payload !== 'object' || payload === null) return undefined;

  const configLabelKey = extractConfigLabelKey(
    payload as Record<string, unknown>,
    key
  );

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}

function extractConfigLabelKey(
  payload: Record<string, unknown>,
  key: string
): string {
  const payloadPayload = getPayloadPayload(payload);

  if (key in payload && typeof payload[key] === 'string') {
    return payload[key] as string;
  }

  if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key] === 'string'
  ) {
    return payloadPayload[key] as string;
  }

  return key;
}

function getPayloadPayload(
  payload: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (
    'payload' in payload &&
    typeof (payload as any).payload === 'object' &&
    (payload as any).payload !== null
  ) {
    return (payload as any).payload as Record<string, unknown>;
  }
  return undefined;
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
