import { Timeline } from "@/components/partner/PartnerBits";
import { actorLabel, eventText, eventTitle, whenIST } from "@/lib/partnerReview";

// An application's events as a timeline, newest first. Used by the review screen and by the partner page's onboarding record.
const OnboardingTimeline = ({ events, me }) => (
  <Timeline
    items={[...events].reverse().map((e) => {
      const text = eventText(e.payload);
      return {
        title: eventTitle(e),
        sub: (
          <>
            {text && <span className="block whitespace-pre-wrap text-foreground">{text}</span>}
            {actorLabel(e, me)} · {whenIST(e.created_at)}
          </>
        ),
      };
    })}
  />
);

export default OnboardingTimeline;
