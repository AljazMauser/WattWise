import fitparse
import gpxpy
import pandas as pd
import numpy as np
from io import BytesIO
from datetime import datetime
import math

def clean_float(val):
    if val is None or pd.isna(val) or math.isnan(float(val)):
        return None
    return float(val)

def calculate_advanced_metrics(df: pd.DataFrame, ftp: int = 250):
    np_val = None
    if_factor = None
    tss = None
    
    if 'power' in df.columns and not df['power'].isnull().all():
        rolling_30s = df['power'].rolling(window=30, min_periods=1).mean()
        np_val = (rolling_30s ** 4).mean() ** 0.25
        
        if_factor = np_val / ftp
        
        duration_s = (df['timestamp'].iloc[-1] - df['timestamp'].iloc[0]).total_seconds()
        tss = (duration_s * np_val * if_factor) / (ftp * 3600) * 100
        
    return {
        "np": clean_float(np_val),
        "if_factor": clean_float(if_factor),
        "tss": clean_float(tss)
    }

def process_fit_file(file_bytes: bytes, ftp: int = 250):
    fitfile = fitparse.FitFile(BytesIO(file_bytes))
    records = []
    
    for record in fitfile.get_messages('record'):
        data = {}
        for record_data in record:
            data[record_data.name] = record_data.value
        if 'timestamp' in data:
            records.append({
                'timestamp': data.get('timestamp'),
                'lat': data.get('position_lat', 0) / (2**31 / 180) if data.get('position_lat') else None,
                'lon': data.get('position_long', 0) / (2**31 / 180) if data.get('position_long') else None,
                'alt': data.get('altitude'),
                'hr': data.get('heart_rate'),
                'cadence': data.get('cadence'),
                'power': data.get('power'),
                'speed': data.get('speed')
            })
            
    df = pd.DataFrame(records)
    if df.empty:
        return None
        
    duration = (df['timestamp'].max() - df['timestamp'].min()).total_seconds()
    distance = None
    if 'distance' in df.columns:
        distance = df['distance'].max() - df['distance'].min()
    
    avg_speed = df['speed'].mean() if 'speed' in df.columns else None
    max_speed = df['speed'].max() if 'speed' in df.columns else None
    avg_hr = df['hr'].mean() if 'hr' in df.columns else None
    max_hr = df['hr'].max() if 'hr' in df.columns else None
    avg_power = df['power'].mean() if 'power' in df.columns else None
    
    elevation_gain = None
    if 'alt' in df.columns:
        alt_diffs = df['alt'].diff()
        elevation_gain = alt_diffs[alt_diffs > 0].sum()
        
    adv_metrics = calculate_advanced_metrics(df, ftp)
    
    date_val = df['timestamp'].min()
    # Convert timestamps to ISO string for JSON serialization
    df['timestamp'] = df['timestamp'].astype(str)
    
    # Replace nan with None
    time_series = df.replace({np.nan: None}).to_dict(orient='records')
    
    return {
        "date": date_val,
        "duration": clean_float(duration),
        "distance": clean_float(distance),
        "avg_speed": clean_float(avg_speed),
        "max_speed": clean_float(max_speed),
        "elevation_gain": clean_float(elevation_gain),
        "avg_hr": clean_float(avg_hr),
        "max_hr": clean_float(max_hr),
        "avg_power": clean_float(avg_power),
        "np": adv_metrics["np"],
        "if_factor": adv_metrics["if_factor"],
        "tss": adv_metrics["tss"],
        "time_series_data": time_series
    }

def process_gpx_file(file_bytes: bytes, ftp: int = 250):
    gpx = gpxpy.parse(BytesIO(file_bytes))
    records = []
    
    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                hr, cad, power = None, None, None
                for ext in point.extensions:
                    if 'hr' in ext.tag: hr = int(ext.text)
                    if 'cad' in ext.tag: cad = int(ext.text)
                    if 'power' in ext.tag: power = float(ext.text)
                
                records.append({
                    'timestamp': point.time,
                    'lat': point.latitude,
                    'lon': point.longitude,
                    'alt': point.elevation,
                    'hr': hr,
                    'cadence': cad,
                    'power': power
                })
                
    df = pd.DataFrame(records)
    if df.empty:
        return None
        
    df['timestamp'] = pd.to_datetime(df['timestamp']).dt.tz_localize(None)
        
    duration = (df['timestamp'].max() - df['timestamp'].min()).total_seconds()
    
    avg_hr = df['hr'].mean() if 'hr' in df.columns else None
    max_hr = df['hr'].max() if 'hr' in df.columns else None
    avg_power = df['power'].mean() if 'power' in df.columns else None
    
    elevation_gain = None
    if 'alt' in df.columns:
        alt_diffs = df['alt'].diff()
        elevation_gain = alt_diffs[alt_diffs > 0].sum()
        
    adv_metrics = calculate_advanced_metrics(df, ftp)
    
    date_val = df['timestamp'].min()
    df['timestamp'] = df['timestamp'].astype(str)
    time_series = df.replace({np.nan: None}).to_dict(orient='records')
    
    return {
        "date": date_val,
        "duration": clean_float(duration),
        "distance": None,
        "avg_speed": None,
        "max_speed": None,
        "elevation_gain": clean_float(elevation_gain),
        "avg_hr": clean_float(avg_hr),
        "max_hr": clean_float(max_hr),
        "avg_power": clean_float(avg_power),
        "np": adv_metrics["np"],
        "if_factor": adv_metrics["if_factor"],
        "tss": adv_metrics["tss"],
        "time_series_data": time_series
    }
