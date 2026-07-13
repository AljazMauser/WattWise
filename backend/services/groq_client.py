import json
from groq import Groq
from core.config import settings

def generate_coach_summary(ride_metrics: dict, time_series: list) -> str:
    if not settings.GROQ_API_KEY:
        return "Groq API key not configured. AI Coaching is unavailable."
        
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    # We shouldn't send the entire time series if it's huge, 
    # instead we can aggregate it into 5-minute chunks for the LLM
    chunked_data = []
    chunk_size = max(1, len(time_series) // 20) # Max 20 chunks
    
    for i in range(0, len(time_series), chunk_size):
        chunk = time_series[i:i+chunk_size]
        valid_power = [p['power'] for p in chunk if p.get('power') is not None]
        valid_hr = [p['hr'] for p in chunk if p.get('hr') is not None]
        
        chunked_data.append({
            "chunk_index": i // chunk_size,
            "avg_power": sum(valid_power) / len(valid_power) if valid_power else None,
            "max_power": max(valid_power) if valid_power else None,
            "avg_hr": sum(valid_hr) / len(valid_hr) if valid_hr else None,
            "max_hr": max(valid_hr) if valid_hr else None,
        })
    
    prompt = f"""
    Act as an elite cycling coach. Analyze this ride and provide a short, motivating, and highly analytical review.
    Focus on the power data (NP, IF, TSS) if available, pacing, and heart rate response.
    
    Overall Ride Metrics:
    - Duration: {ride_metrics.get('duration', 0) / 60:.1f} minutes
    - Distance: {ride_metrics.get('distance', 0) / 1000 if ride_metrics.get('distance') else 'N/A'} km
    - Elevation Gain: {ride_metrics.get('elevation_gain', 'N/A')} m
    - Average Power: {ride_metrics.get('avg_power', 'N/A')} W
    - Normalized Power (NP): {ride_metrics.get('np', 'N/A')} W
    - Intensity Factor (IF): {ride_metrics.get('if_factor', 'N/A')}
    - Training Stress Score (TSS): {ride_metrics.get('tss', 'N/A')}
    - Average HR: {ride_metrics.get('avg_hr', 'N/A')} bpm
    - Max HR: {ride_metrics.get('max_hr', 'N/A')} bpm
    
    Interval Breakdown (Summarized into {len(chunked_data)} segments):
    {json.dumps(chunked_data, indent=2)}
    
    Provide your review formatted in markdown. Include a bold title, a section for pacing, a section for physiological response (HR vs Power), and actionable advice for the next ride.
    """
    
    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a world-class cycling coach analyzing power and heart rate data to provide insightful training feedback."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=1024,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Failed to generate coaching summary: {str(e)}"
