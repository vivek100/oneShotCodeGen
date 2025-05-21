declare module 'mixpanel-browser' {
  interface MixpanelPeople {
    set(properties: Record<string, any>): void;
    set_once(properties: Record<string, any>): void;
    increment(property: string, value?: number): void;
    append(property: string, value: any): void;
    union(property: string, values: any[]): void;
    track_charge(amount: number, properties?: Record<string, any>): void;
    clear_charges(): void;
    delete_user(): void;
  }

  interface MixpanelStatic {
    init(token: string, options?: any, name?: string): void;
    track(event_name: string, properties?: Record<string, any>, callback?: () => void): void;
    track_links(query: string, event_name: string, properties?: Record<string, any>): void;
    track_forms(query: string, event_name: string, properties?: Record<string, any>): void;
    identify(unique_id: string): void;
    alias(alias: string, original?: string): void;
    people: MixpanelPeople;
    get_distinct_id(): string;
    register(properties: Record<string, any>): void;
    register_once(properties: Record<string, any>): void;
    unregister(property: string): void;
    reset(): void;
    get_property(property_name: string): any;
    time_event(event_name: string): void;
  }

  const mixpanel: MixpanelStatic;
  export default mixpanel;
} 