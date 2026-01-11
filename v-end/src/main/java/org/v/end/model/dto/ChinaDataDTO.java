package org.v.end.model.dto;

import java.util.List;

public class ChinaDataDTO {
    private List<ProvinceDTO> provinces;

    public ChinaDataDTO() {
    }

    public ChinaDataDTO(List<ProvinceDTO> provinces) {
        this.provinces = provinces;
    }

    public List<ProvinceDTO> getProvinces() {
        return provinces;
    }

    public void setProvinces(List<ProvinceDTO> provinces) {
        this.provinces = provinces;
    }
}
