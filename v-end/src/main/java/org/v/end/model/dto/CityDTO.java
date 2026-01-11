package org.v.end.model.dto;

public class CityDTO {
    private String cityName;
    private String weatherCode;

    public CityDTO() {
    }

    public CityDTO(String cityName, String weatherCode) {
        this.cityName = cityName;
        this.weatherCode = weatherCode;
    }

    public String getCityName() {
        return cityName;
    }

    public void setCityName(String cityName) {
        this.cityName = cityName;
    }

    public String getWeatherCode() {
        return weatherCode;
    }

    public void setWeatherCode(String weatherCode) {
        this.weatherCode = weatherCode;
    }
}
