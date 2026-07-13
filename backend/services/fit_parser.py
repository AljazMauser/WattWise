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

def calculate_distance_and_speed(df: pd.DataFrame):
    if 'lat' in df.columns and 'lon' in df.columns:
        valid_coords = df['lat'].notna() & df['lon'].notna()
        if valid_coords.any():
            lat1 = np.radians(df.loc[valid_coords, 'lat'].shift())
            lon1 = np.radians(df.loc[valid_coords, 'lon'].shift())
            lat2 = np.radians(df.loc[valid_coords, 'lat'])
            lon2 = np.radians(df.loc[valid_coords, 'lon'])
            
            dlon = lon2 - lon1
            dlat = lat2 - lat1
            
            a = np.sin(dlat / 2.0)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2.0)**2
            c = 2 * np.arcsin(np.sqrt(a))
            dist_m = 6371000 * c
            
            df['dist_diff'] = 0.0
            df.loc[valid_coords, 'dist_diff'] = dist_m
            df['dist_diff'] = df['dist_diff'].fillna(0)
            df['distance_calc'] = df['dist_diff'].cumsum()
            
            time_diff = df['timestamp'].diff().dt.total_seconds()
            df['speed_calc'] = df['dist_diff'] / time_diff
    return df

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
                'speed': data.get('speed'),
                'distance': data.get('distance')
            })
            
    df = pd.DataFrame(records)
    if df.empty:
        return None
        
    df = calculate_distance_and_speed(df)
        
    duration = (df['timestamp'].max() - df['timestamp'].min()).total_seconds()
    
    distance = None
    if 'distance' in df.columns and not df['distance'].isnull().all():
        distance = df['distance'].max() - df['distance'].min()
    elif 'distance_calc' in df.columns:
        distance = df['distance_calc'].max()
    if distance == 0: distance = None
    
    avg_speed = df['speed'].mean() if 'speed' in df.columns and not df['speed'].isnull().all() else None
    max_speed = df['speed'].max() if 'speed' in df.columns and not df['speed'].isnull().all() else None
    if avg_speed is None and 'speed_calc' in df.columns:
        valid_speed = df['speed_calc'].replace([np.inf, -np.inf], np.nan).dropna()
        if not valid_speed.empty:
            avg_speed = valid_speed.mean()
            max_speed = valid_speed.max()
            
    avg_hr = df['hr'].mean() if 'hr' in df.columns else None
    max_hr = df['hr'].max() if 'hr' in df.columns else None
    avg_power = df['power'].mean() if 'power' in df.columns else None
    
    elevation_gain = None
    if 'alt' in df.columns:
        alt_diffs = df['alt'].diff()
        elevation_gain = alt_diffs[alt_diffs > 0].sum()
        
    adv_metrics = calculate_advanced_metrics(df, ftp)
    
    date_val = df['timestamp'].min()
    if pd.isna(date_val):
        date_val = None
    else:
        date_val = date_val.to_pydatetime()
        
    df['timestamp'] = df['timestamp'].astype(str).replace({'NaT': None, 'nan': None})
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
    df = calculate_distance_and_speed(df)
        
    duration = (df['timestamp'].max() - df['timestamp'].min()).total_seconds()
    
    distance = None
    if 'distance_calc' in df.columns:
        distance = df['distance_calc'].max()
    if distance == 0: distance = None
    
    avg_speed, max_speed = None, None
    if 'speed_calc' in df.columns:
        valid_speed = df['speed_calc'].replace([np.inf, -np.inf], np.nan).dropna()
        if not valid_speed.empty:
            avg_speed = valid_speed.mean()
            max_speed = valid_speed.max()
            # map calculated speed (m/s) back to the 'speed' column for time series chart
            df['speed'] = df['speed_calc']
    
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
